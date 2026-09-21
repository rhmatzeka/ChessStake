# ChessStake (PawnPool): AI Chess Arena

A live chess game where **the audience plays instead of two players**. Viewers connect a crypto wallet, join team White or Black, and bet on **which piece should move next**. When the voting timer ends, the piece with the most bets wins, and an **AI picks the best legal move** for that piece.

Because the AI always makes the move, no single person can sabotage the game.

**Live demo:** https://pawnpool.rahmateka.my.id

## How a game works

1. Join a team (White or Black) by placing your first bet. You can't switch teams after that.
2. Each turn has a **20-second vote**. You can bet **once per turn**.
3. Each piece has its own price per vote:

   | Piece | Price per vote |
   | --- | --- |
   | Pawn | 0.0001 ETH |
   | King | 0.0002 ETH |
   | Knight | 0.0003 ETH |
   | Bishop | 0.0003 ETH |
   | Rook | 0.0005 ETH |
   | Queen | 0.0010 ETH |

4. The piece with the most money on it wins the vote, and the AI moves it.
5. If nobody votes, the timer restarts up to 3 times, then the game is cancelled.

## Payouts

| Result | What happens to the pool |
| --- | --- |
| Win | The winning team shares **90%** of the whole pool, in proportion to what each person bet. **10%** goes to the platform. |
| Draw | Everyone gets **90%** back, in proportion to their bets. |
| Cancelled | Everyone gets **100%** back. |
| Late bet (confirmed after the turn closed) | Doesn't count as a vote; you can claim a **full refund**. |

## Pages

| Page | What you can do |
| --- | --- |
| `/arena` | Watch the live board and place your vote |
| `/matches` | Browse matches; `/host` lets you start a new one |
| `/agents` | Pick an **AI betting agent** that recommends a piece or votes for you automatically |
| `/leaderboard` | Top bettors and top AI agents |
| `/claim` | Collect rewards and refunds |
| `/how-to-play` | The rules in plain language |

## Tech stack

- **Web app + game API**: Next.js (App Router), TypeScript, Tailwind CSS, Zustand, wagmi, ConnectKit
- **Database**: PostgreSQL with Prisma (a free [Neon](https://neon.tech) database works)
- **AI move picker**: chess.js with a Stockfish-style evaluation
- **Smart contract**: Solidity, Hardhat, OpenZeppelin v5, on Ethereum Sepolia
- **Older backend** (optional): Express + Socket.IO in `apps/api`

## Project structure

```text
apps/web/            Next.js app and the game API (/api) used for the demo
apps/api/            Older Express + Socket.IO server (not needed for the demo)
packages/contracts/  Solidity contracts (Hardhat)
packages/shared/     Shared constants, types, and contract ABIs
```

## Getting started

You need Node.js 20+, pnpm 9+, and a PostgreSQL database.

1. Install everything from the project root:

   ```bash
   pnpm install --no-frozen-lockfile --ignore-scripts
   ```

2. Copy `.env.example` to `.env` and fill it in. For a local demo these are enough:

   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/pawnpool
   NEXT_PUBLIC_MOCK_CHAIN=true
   ```

   `NEXT_PUBLIC_MOCK_CHAIN=true` fakes the blockchain, so you can play without real ETH.

3. Generate the database client and start the app:

   ```bash
   pnpm --filter web prisma:generate
   pnpm --filter web dev
   ```

   Open http://localhost:3000. The game API runs at http://localhost:3000/api.

### Smart contracts

```bash
cd packages/contracts
npx hardhat compile
npx hardhat test
```

## Deploying to Vercel

The demo runs entirely on Vercel, with no separate backend server.

1. Create a free PostgreSQL database on Neon.
2. Set these environment variables in Vercel:

   ```env
   DATABASE_URL=postgresql://...
   NEXT_PUBLIC_MOCK_CHAIN=true
   NEXT_PUBLIC_ENABLE_ONCHAIN_BETS=false
   ```

3. Use these commands:
   - Install: `pnpm install --no-frozen-lockfile --ignore-scripts`
   - Build: `pnpm --filter web build`

A few things to know about the demo mode:

- The page **checks for updates every 2 seconds** instead of using a live socket.
- When a turn's timer hits zero, the page calls `/api/games/:gameId/resolve-expired-turn`.
- The build runs `prisma db push`, which creates the demo tables for you.
- Rewards and refunds on `/claim` are only **marked in the database**; no real ETH is sent.

## Security

- **ReentrancyGuard** protects reward and refund withdrawals.
- **AccessControl** separates the admin (`DEFAULT_ADMIN_ROLE`) from the backend operator (`OPERATOR_ROLE`).
- **Late bets are kept separate** from the game pool so they can always be refunded safely.
- **Event indexing is idempotent**: events are tracked by transaction hash and log index, so chain reorgs or replays can't double-count them.

## License

Released under the [MIT License](LICENSE).
