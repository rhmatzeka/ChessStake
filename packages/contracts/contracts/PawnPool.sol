// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract PawnPool is ReentrancyGuard, AccessControl, Pausable {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public platformFeeBps = 1_000; // 10%
    address public treasury;

    enum GameStatus { None, Active, Finished, Cancelled }
    enum GameResult { None, WhiteWin, BlackWin, Draw, Cancelled }
    enum Team { None, White, Black }
    enum PieceType { None, Pawn, Knight, Bishop, Rook, Queen, King }

    struct Game {
        GameStatus status;
        GameResult result;
        uint256 totalPool;
        uint256 whitePool;
        uint256 blackPool;
        uint256 rewardPool;
        uint256 feeAmount;
        uint256 createdAt;
        uint256 resolvedAt;
    }

    struct PlayerGameData {
        Team lockedTeam;
        uint256 whiteAmount;
        uint256 blackAmount;
        uint256 lateRefundableAmount;
        bool settlementClaimed;
    }

    struct TurnBet {
        bool exists;
        bool lateRefundable;
        Team team;
        PieceType piece;
        uint256 amount;
    }

    // Config prices
    mapping(uint8 => uint256) public piecePrices;

    // Game mappings
    mapping(uint256 => Game) public games;
    mapping(uint256 => mapping(address => PlayerGameData)) public playerGameData;
    mapping(uint256 => mapping(uint256 => mapping(address => TurnBet))) public turnBets;
    mapping(uint256 => mapping(uint256 => bool)) public turnLocked;

    // Events
    event GameCreated(uint256 indexed gameId);
    event TurnLocked(uint256 indexed gameId, uint256 indexed turnNumber);
    event BetPlaced(
        uint256 indexed gameId,
        uint256 indexed turnNumber,
        address indexed player,
        uint8 team,
        uint8 piece,
        uint256 amount
    );
    event LateBetMarked(uint256 indexed gameId, uint256 indexed turnNumber, address indexed player, uint256 amount);
    event GameResolved(uint256 indexed gameId, uint8 result, uint256 totalPool, uint256 feeAmount);
    event GameCancelled(uint256 indexed gameId);
    event RewardClaimed(uint256 indexed gameId, address indexed player, uint256 amount);
    event RefundClaimed(uint256 indexed gameId, address indexed player, uint256 amount);
    event TreasuryUpdated(address indexed treasury);
    event PlatformFeeUpdated(uint256 feeBps);

    constructor(address _admin, address _operator, address _treasury) {
        require(_admin != address(0), "Invalid admin");
        require(_operator != address(0), "Invalid operator");
        require(_treasury != address(0), "Invalid treasury");

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _operator);
        treasury = _treasury;

        // Set default prices
        piecePrices[uint8(PieceType.Pawn)] = 0.0001 ether;
        piecePrices[uint8(PieceType.King)] = 0.0002 ether;
        piecePrices[uint8(PieceType.Knight)] = 0.0003 ether;
        piecePrices[uint8(PieceType.Bishop)] = 0.0003 ether;
        piecePrices[uint8(PieceType.Rook)] = 0.0005 ether;
        piecePrices[uint8(PieceType.Queen)] = 0.0010 ether;
    }

    // --- Admin Config ---

    function setPiecePrice(uint8 piece, uint256 price) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(piece >= uint8(PieceType.Pawn) && piece <= uint8(PieceType.King), "Invalid piece");
        piecePrices[piece] = price;
    }

    function setPlatformFeeBps(uint256 feeBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(feeBps <= BPS_DENOMINATOR, "Fee exceed 100%");
        platformFeeBps = feeBps;
        emit PlatformFeeUpdated(feeBps);
    }

    function setTreasury(address _treasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // --- Operator Actions ---

    function createGame(uint256 gameId) external onlyRole(OPERATOR_ROLE) whenNotPaused {
        require(games[gameId].status == GameStatus.None, "Game already exists");
        
        games[gameId] = Game({
            status: GameStatus.Active,
            result: GameResult.None,
            totalPool: 0,
            whitePool: 0,
            blackPool: 0,
            rewardPool: 0,
            feeAmount: 0,
            createdAt: block.timestamp,
            resolvedAt: 0
        });

        emit GameCreated(gameId);
    }

    function lockTurn(uint256 gameId, uint256 turnNumber) external onlyRole(OPERATOR_ROLE) {
        require(games[gameId].status == GameStatus.Active, "Game not active");
        require(!turnLocked[gameId][turnNumber], "Turn already locked");
        
        turnLocked[gameId][turnNumber] = true;
        emit TurnLocked(gameId, turnNumber);
    }

    function markLateRefundable(
        uint256 gameId,
        uint256 turnNumber,
        address player
    ) external onlyRole(OPERATOR_ROLE) {
        Game storage game = games[gameId];
        TurnBet storage tBet = turnBets[gameId][turnNumber][player];
        
        require(game.status == GameStatus.Active, "Game not active");
        require(tBet.exists, "Bet does not exist");
        require(!tBet.lateRefundable, "Already marked late");

        tBet.lateRefundable = true;
        uint256 amt = tBet.amount;

        // Kurangi dari total pools
        game.totalPool -= amt;
        if (tBet.team == Team.White) {
            game.whitePool -= amt;
            playerGameData[gameId][player].whiteAmount -= amt;
        } else {
            game.blackPool -= amt;
            playerGameData[gameId][player].blackAmount -= amt;
        }

        // Simpan ke late refund balance player
        playerGameData[gameId][player].lateRefundableAmount += amt;

        emit LateBetMarked(gameId, turnNumber, player, amt);
    }

    function resolveGame(uint256 gameId, uint8 result) external onlyRole(OPERATOR_ROLE) nonReentrant {
        Game storage game = games[gameId];
        require(game.status == GameStatus.Active, "Game not active");
        require(result >= uint8(GameResult.WhiteWin) && result <= uint8(GameResult.Draw), "Invalid result");

        game.status = GameStatus.Finished;
        game.result = GameResult(result);
        game.resolvedAt = block.timestamp;

        uint256 fee = 0;
        if (game.totalPool > 0) {
            fee = (game.totalPool * platformFeeBps) / BPS_DENOMINATOR;
            game.feeAmount = fee;
            game.rewardPool = game.totalPool - fee;
        }

        emit GameResolved(gameId, result, game.totalPool, fee);

        // Langsung transfer fee ke treasury (EOA)
        if (fee > 0) {
            (bool success, ) = payable(treasury).call{value: fee}("");
            require(success, "Fee transfer failed");
        }
    }

    function cancelGame(uint256 gameId) external onlyRole(OPERATOR_ROLE) {
        Game storage game = games[gameId];
        require(game.status == GameStatus.Active, "Game not active");

        game.status = GameStatus.Cancelled;
        game.result = GameResult.Cancelled;
        game.resolvedAt = block.timestamp;

        emit GameCancelled(gameId);
    }

    // --- Player Actions ---

    function placeBet(
        uint256 gameId,
        uint256 turnNumber,
        uint8 team,
        uint8 piece
    ) external payable whenNotPaused nonReentrant {
        Game storage game = games[gameId];
        require(game.status == GameStatus.Active, "Game not active");
        require(!turnLocked[gameId][turnNumber], "Turn locked");
        require(msg.value == piecePrices[piece] && msg.value > 0, "Incorrect piece price");
        require(team == uint8(Team.White) || team == uint8(Team.Black), "Invalid team");

        PlayerGameData storage player = playerGameData[gameId][msg.sender];
        
        // Pindah team check
        if (player.lockedTeam != Team.None) {
            require(player.lockedTeam == Team(team), "Team already locked");
        } else {
            player.lockedTeam = Team(team);
        }

        // Double bet check per turn
        require(!turnBets[gameId][turnNumber][msg.sender].exists, "Already bet this turn");

        // Record bet
        turnBets[gameId][turnNumber][msg.sender] = TurnBet({
            exists: true,
            lateRefundable: false,
            team: Team(team),
            piece: PieceType(piece),
            amount: msg.value
        });

        // Update pools
        game.totalPool += msg.value;
        if (Team(team) == Team.White) {
            game.whitePool += msg.value;
            player.whiteAmount += msg.value;
        } else {
            game.blackPool += msg.value;
            player.blackAmount += msg.value;
        }

        emit BetPlaced(gameId, turnNumber, msg.sender, team, piece, msg.value);
    }

    function claimReward(uint256 gameId) external nonReentrant {
        Game storage game = games[gameId];
        require(game.status == GameStatus.Finished, "Game not finished");
        require(game.result == GameResult.WhiteWin || game.result == GameResult.BlackWin, "No winner in this game");

        PlayerGameData storage player = playerGameData[gameId][msg.sender];
        require(!player.settlementClaimed, "Already claimed settlement");

        uint256 claimable = 0;
        if (game.result == GameResult.WhiteWin) {
            require(player.whiteAmount > 0, "No winning bets");
            claimable = (player.whiteAmount * game.rewardPool) / game.whitePool;
        } else {
            require(player.blackAmount > 0, "No winning bets");
            claimable = (player.blackAmount * game.rewardPool) / game.blackPool;
        }

        require(claimable > 0, "Nothing to claim");
        player.settlementClaimed = true;

        (bool success, ) = payable(msg.sender).call{value: claimable}("");
        require(success, "Reward transfer failed");

        emit RewardClaimed(gameId, msg.sender, claimable);
    }

    function claimRefund(uint256 gameId) external nonReentrant {
        Game storage game = games[gameId];
        PlayerGameData storage player = playerGameData[gameId][msg.sender];

        uint256 claimable = 0;

        // 1. Check late refund
        if (player.lateRefundableAmount > 0) {
            claimable += player.lateRefundableAmount;
            player.lateRefundableAmount = 0;
        }

        // 2. Check game status refund (draw/cancelled)
        if (!player.settlementClaimed) {
            if (game.status == GameStatus.Cancelled) {
                // Refund 100%
                uint256 totalUserBet = player.whiteAmount + player.blackAmount;
                if (totalUserBet > 0) {
                    claimable += totalUserBet;
                    player.settlementClaimed = true;
                }
            } else if (game.status == GameStatus.Finished && game.result == GameResult.Draw) {
                // Refund 90% (potong 10% fee)
                uint256 totalUserBet = player.whiteAmount + player.blackAmount;
                if (totalUserBet > 0) {
                    uint256 share = (totalUserBet * game.rewardPool) / game.totalPool;
                    claimable += share;
                    player.settlementClaimed = true;
                }
            }
        }

        require(claimable > 0, "Nothing to refund");

        (bool success, ) = payable(msg.sender).call{value: claimable}("");
        require(success, "Refund transfer failed");

        emit RefundClaimed(gameId, msg.sender, claimable);
    }
}
