# ChessStake Execution Plan

## Objective

Turn ChessStake from a hackathon demo into a more mature creator-led interactive AI chess arena.

The project should move away from being positioned as a generic Web3 betting demo and become:

```text
Interactive AI Chess Arena for Creators and Communities
```

Core product narrative:

```text
ChessStake lets creators host live AI chess matches where fans back teams, vote strategy, and share rewards from the outcome.
```

## Game Concept

ChessStake is not only a normal chess match. The strongest concept is:

```text
Crowd-controlled chess with optional player-owned AI agents.
```

Core loop:

```text
1. A creator or community hosts a chess arena.
2. Players join White or Black.
3. Each turn, players back a strategy or piece.
4. The highest-backed legal option wins the crowd decision.
5. An AI resolver chooses the best legal move for that winning option.
6. The board updates and the next side takes the turn.
7. The match ends by checkmate, draw, max move limit, or cancellation.
8. Rewards, reputation, leaderboard points, and creator stats update.
```

Current MVP behavior:

```text
Players vote for a piece type. The system uses chess.js for legal moves and a simple heuristic resolver to choose the move.
```

Target behavior:

```text
Players can either vote manually or delegate their decision to their own AI agent. The arena can also include creator/community agents, public agents, and AI commentary.
```

## AI Integration Direction

The project currently uses a local heuristic move picker, not a real AI provider.

Current files:

```text
apps/web/src/server/game-service.ts
apps/web/src/server/chess-state.ts
```

Current AI logic:

- `chess.js` generates legal moves.
- The resolver prefers moves that capture higher-value pieces.
- No Grok/xAI/OpenAI/Stockfish API is currently used in the Vercel flow.

Target AI architecture:

```text
Chess rules engine: chess.js
Tactical engine: Stockfish or lightweight local evaluator
LLM strategy/commentary: Grok/xAI or OpenAI-compatible provider
Player-owned agents: user-created strategy profiles that vote or recommend moves
```

Important principle:

```text
LLMs should not be trusted to validate chess legality. chess.js must remain the source of truth for legal moves.
```

Recommended AI responsibilities:

- `chess.js`: legal moves, FEN updates, checkmate/draw validation.
- Stockfish: best tactical move from legal candidates.
- Grok/xAI or LLM: explanation, personality, strategy summary, trash talk, social recap, agent reasoning.
- Player agent: preference model that chooses what piece/strategy to back.

## Player-Owned AI Agents

This is the next major feature that can make the game unique.

Concept:

```text
Each player can create an AI agent that represents their chess style. The agent can recommend or auto-submit votes during live matches.
```

Player agent examples:

- Aggressive Attacker: prefers captures, queen pressure, king-side attacks.
- Defensive Wall: prefers safe moves, king safety, pawn structure.
- Gambit Hunter: accepts risk for initiative.
- Endgame Grinder: prefers simplification and material advantage.
- Meme Agent: plays chaotic but legal strategies.

Player agent loop:

```text
1. Player creates an agent.
2. Player chooses personality and strategy weights.
3. Agent can inspect current FEN, legal pieces, vote tally, and match context.
4. Agent recommends a piece or move.
5. Player can manually approve the agent recommendation.
6. Later, player can enable auto-vote within limits.
7. Agent performance is tracked on leaderboard.
```

MVP version:

```text
Agent recommends a piece. Player still clicks to confirm.
```

Advanced version:

```text
Agent auto-votes for the player using a configured budget, risk profile, and allowed match types.
```

## Agent Game Modes

Recommended modes:

```text
Manual Crowd Mode
Players vote manually. Current MVP.
```

```text
Agent Assist Mode
Players create agents that recommend votes, but user confirms.
```

```text
Agent Auto-Vote Mode
Player agents auto-submit votes within user-defined rules.
```

```text
Agent League
Agents compete across matches and climb rankings.
```

```text
Creator Agent Battle
Creator deploys a community agent against another creator/community agent.
```

```text
Human Crowd vs AI Agent
Crowd controls one side, a named AI agent controls the other side.
```

## Player Agent Monetization

AI agents can create a stronger business model than reward-pool fee alone.

Potential revenue streams:

- Paid premium agent slots.
- Agent customization skins/personas.
- Advanced strategy presets.
- Creator-branded agents.
- Agent league entry fee.
- Sponsored agents.
- Marketplace fee if agents/templates are tradable later.

Suggested pricing:

```text
Free: 1 basic agent
Pro: $5/month to $9/month for multiple agents and advanced settings
Creator Pro: custom community agent and analytics
Agent League: entry fee or seasonal pass
```

Important: do not launch paid auto-vote with real-money reward pools before legal review.

## Agent Data Model Direction

Potential Prisma models:

```prisma
model PlayerAgent {
  id              String   @id @default(cuid())
  ownerAddress    String
  name            String
  description     String?
  personality     String
  riskLevel       String   @default("BALANCED")
  preferredTeam   String?
  isPublic        Boolean  @default(false)
  autoVoteEnabled Boolean  @default(false)
  maxVoteWei      String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model AgentStrategyProfile {
  id             String @id @default(cuid())
  agentId        String @unique
  aggression     Int    @default(50)
  defense        Int    @default(50)
  material       Int    @default(50)
  kingSafety     Int    @default(50)
  centerControl  Int    @default(50)
  randomness     Int    @default(10)
}

model AgentDecision {
  id              String   @id @default(cuid())
  agentId         String
  gameId          String
  turnNumber      Int
  fen             String
  recommendedPiece String
  recommendedMove  String?
  confidence      Int
  reasoning       String?
  wasSubmitted    Boolean  @default(false)
  createdAt       DateTime @default(now())
}
```

MVP can start simpler with only `PlayerAgent` and `AgentDecision`.

## Agent API Direction

Recommended routes:

```text
GET  /api/agents
POST /api/agents
GET  /api/agents/:agentId
PATCH /api/agents/:agentId
POST /api/agents/:agentId/recommend
POST /api/agents/:agentId/auto-vote
GET  /api/agents/:agentId/history
GET  /api/agent-leaderboard
```

Responsibilities:

- `/api/agents`: list agents owned by wallet/session.
- `POST /api/agents`: create player agent.
- `/recommend`: agent inspects match state and recommends a piece/move.
- `/auto-vote`: submits vote only if user enabled auto mode and constraints pass.
- `/history`: shows past agent decisions and performance.
- `/agent-leaderboard`: ranks agents by wins, accuracy, ROI, and activity.

## Agent UI Direction

Recommended pages/components:

```text
/agents
/agents/create
/agents/[agentId]
components/agents/AgentCard.tsx
components/agents/AgentBuilderForm.tsx
components/agents/AgentRecommendationPanel.tsx
components/agents/AgentLeaderboard.tsx
```

Arena integration:

- Show `Use My Agent` button in voting panel.
- Show agent recommendation beside manual piece choices.
- Show confidence and short reasoning.
- Let user click `Back Agent Pick`.
- Later add `Enable Auto-Vote` with clear risk/budget limits.

Agent builder fields:

- Agent name.
- Personality.
- Risk level.
- Preferred strategy.
- Favorite pieces.
- Manual approval or auto-vote.
- Max vote amount.
- Public/private visibility.

## AI Provider Plan

Recommended abstraction:

```text
apps/web/src/server/ai/ai-provider.ts
apps/web/src/server/ai/agent-decision-service.ts
apps/web/src/server/ai/commentary-service.ts
apps/web/src/server/ai/stockfish-service.ts
```

Provider interface:

```ts
type AgentDecisionInput = {
  fen: string;
  team: 'WHITE' | 'BLACK';
  legalPieces: string[];
  legalMovesByPiece: Record<string, string[]>;
  votes: Array<{ piece: string; totalAmountWei: string; bettorCount: number }>;
  agentProfile: {
    personality: string;
    riskLevel: string;
    aggression: number;
    defense: number;
    material: number;
  };
};

type AgentDecisionOutput = {
  piece: string;
  move?: string;
  confidence: number;
  reasoning: string;
};
```

Provider priority:

```text
1. Deterministic local agent scoring for MVP
2. Stockfish for tactical scoring
3. Grok/xAI for reasoning/commentary/personality
4. Optional OpenAI-compatible fallback
```

Environment variables:

```env
XAI_API_KEY=...
AI_PROVIDER=xai
AI_AGENT_MODE=assist
AI_COMMENTARY_ENABLED=true
```

Security rules:

- Never expose API keys to client.
- AI calls must happen server-side.
- Always validate returned piece/move with `chess.js`.
- If AI returns illegal move, fall back to legal local scorer.

## Agent Scoring MVP

Before using Grok/xAI, implement local scoring so the feature works reliably.

Agent scoring can use:

- Capture value.
- Legal move count.
- Piece preference.
- Risk profile.
- Existing vote momentum.
- King safety heuristic.
- Randomness weight.

Example:

```text
Aggressive agent: capture value + queen/rook preference + attack squares
Defensive agent: king safety + avoids hanging pieces
Balanced agent: material + mobility + low randomness
```

This keeps the product functional even without paid AI API usage.

## Updated AI/Agent Execution Phases

### Phase AI-0: Clarify AI In Product

Tasks:

- Rename current resolver from generic AI to `Strategy Resolver` or `AI Resolver` with clear explanation.
- Add UI text explaining that chess legality is enforced by `chess.js`.
- Add move explanation placeholder.

### Phase AI-1: AI Commentary

Tasks:

- Add commentary after every move.
- Use local template first.
- Later connect Grok/xAI for richer commentary.

### Phase AI-2: Player Agent Builder MVP

Tasks:

- Add `/agents` and `/agents/create`.
- Add `PlayerAgent` model.
- Let player create one basic agent.
- Store personality and risk profile.

### Phase AI-3: Agent Recommendation In Arena

Tasks:

- Add `Use My Agent` panel inside voting UI.
- Agent recommends piece for current turn.
- Player manually confirms vote.
- Store `AgentDecision`.

### Phase AI-4: Agent Leaderboard

Tasks:

- Track agent recommendations.
- Track submitted agent votes.
- Rank agents by win rate, activity, and accuracy.

### Phase AI-5: Auto-Vote With Limits

Tasks:

- Add opt-in auto-vote.
- Add max vote amount.
- Add match type allowlist.
- Add emergency disable.
- Do not enable for real-money mainnet without legal review.

### Phase AI-6: Grok/xAI Integration

Tasks:

- Add server-side xAI provider.
- Use it for commentary and agent reasoning first.
- Use deterministic local scoring as fallback.
- Do not let LLM bypass legal move validation.

### Phase AI-7: Agent League

Tasks:

- Public agent profiles.
- Agent rankings.
- Creator/community agents.
- Seasonal competitions.
- Optional paid agent slots or league passes.

## Remaining Gaps Before AI Agent Execution

The AI agent plan is directionally strong, but these gaps must be resolved before implementation starts.

## 1. Agent Ownership And Authentication

Problem:

```text
If agents are owned by wallet addresses, the app needs a reliable way to prove that the current user controls the wallet before editing or using an agent.
```

Required decisions:

- Use wallet signature login or continue with lightweight wallet/session identity.
- Decide whether guest users can create temporary agents.
- Decide whether agents are tied to wallet address, user account, or creator account.
- Decide what happens if a player changes wallet.

Recommended MVP:

```text
Agents are tied to wallet address. Editing or auto-vote requires wallet connection. Recommendation-only can work in demo mode with local/session identity.
```

Implementation notes:

- Add signature-based ownership verification before destructive actions.
- Do not allow editing another wallet's agent.
- Store `ownerAddress` normalized lowercase.

## 2. Agent Safety And Abuse Prevention

Problem:

Player-owned agents can be abused for spam, automation, sybil voting, or griefing.

Risks:

- Unlimited agent creation.
- Vote spam.
- Bot-created agents.
- Agent names/descriptions containing offensive content.
- Auto-vote draining user funds if misconfigured.
- Prompt injection if public descriptions are passed into LLM prompts.

Required safeguards:

- Limit free agents per wallet.
- Rate-limit agent recommendation requests.
- Moderate agent names/descriptions.
- Escape/sanitize all user-generated text.
- Add max auto-vote amount.
- Add daily/weekly auto-vote cap.
- Add emergency disable for auto-vote.
- Never pass untrusted text directly into critical LLM instructions.

Recommended MVP:

```text
1 free agent per wallet. Recommendation only. No auto-vote until abuse controls are implemented.
```

## 3. AI Cost Control

Problem:

If every player agent calls Grok/xAI on every turn, costs can explode quickly.

Cost risks:

- Many players request recommendations at once.
- Same FEN/state produces repeated AI calls.
- Agent league simulations can create heavy background usage.
- Commentary per move adds additional AI calls.

Cost controls:

- Start with local deterministic scoring.
- Cache recommendations by `agentProfileHash + fen + team + legalPieces`.
- Use Grok/xAI only for reasoning text, not every scoring decision.
- Add per-wallet rate limits.
- Add per-match AI budget.
- Add fallback when AI provider fails.

Recommended MVP:

```text
No paid AI provider required for agent recommendation. Use local scorer first, then add Grok/xAI for commentary/personality once engagement is proven.
```

## 4. Agent Performance Metrics

Problem:

Agent leaderboard needs clear scoring rules, otherwise users will not trust it.

Metrics to track:

- Recommendation count.
- Submitted vote count.
- Winning-piece accuracy.
- Match win rate.
- Average reward influence.
- Manual approval rate.
- Auto-vote success rate.
- Illegal recommendation rate.
- Confidence calibration.

Suggested agent score:

```text
Agent Score = win contribution + recommendation accuracy + activity streak - illegal/fallback penalties
```

MVP leaderboard:

- Most used agents.
- Highest recommendation accuracy.
- Most winning picks.
- Best match win rate.

## 5. Agent UX Onboarding

Problem:

If users do not understand what an agent does, the feature will feel confusing or fake.

Required UX explanations:

- What the agent can see.
- What the agent cannot do.
- Difference between recommendation and auto-vote.
- Why a recommendation was made.
- Whether the user still needs to confirm.
- Whether any funds are used.

Recommended UI copy:

```text
Your agent recommends a strategy based on the current board, legal moves, and your selected playstyle. You stay in control and confirm before anything is submitted.
```

MVP UX:

- Add `Use My Agent` button.
- Show recommendation card.
- Show confidence.
- Show short reasoning.
- Show `Back Agent Pick` button.
- Show fallback if no agent exists: `Create your first agent`.

## 6. Agent Decision Transparency

Problem:

Users need to trust why an agent recommended a move or piece.

Required fields in `AgentDecision`:

- `inputFen`
- `legalPieces`
- `recommendedPiece`
- `recommendedMove`
- `confidence`
- `reasoning`
- `scoringBreakdown`
- `provider`
- `fallbackUsed`

Recommended addition:

```prisma
scoringBreakdown Json?
provider         String @default("local")
fallbackUsed     Boolean @default(false)
```

## 7. Real AI vs Marketing AI

Problem:

Current app says AI, but actual move resolver is simple heuristic. If the product adds agents, the marketing must not overclaim.

Required copy discipline:

- Say `AI-assisted strategy` only where AI actually exists.
- Say `local strategy resolver` for heuristic logic.
- Say `Grok-powered commentary` only after Grok is actually integrated.

Recommended product wording before Grok integration:

```text
AI-assisted arena with deterministic chess validation and strategy scoring.
```

After Grok integration:

```text
Grok-powered agent reasoning and live commentary.
```

## 8. Legal And Compliance For Auto-Vote

Problem:

Auto-vote plus real-money pools may create additional regulatory risk because the agent acts on behalf of a user.

Required constraints before auto-vote:

- Explicit opt-in.
- Clear max spend.
- Clear match allowlist.
- Clear stop button.
- Audit trail for every auto-vote.
- Legal review before mainnet.

Recommended rollout:

```text
Recommendation-only -> demo auto-vote -> testnet auto-vote -> legal review -> limited mainnet pilot
```

## 9. Technical Reliability

Problem:

AI requests and auto-votes can fail, timeout, or race with turn close.

Required system behavior:

- Agent recommendation timeout under 2 seconds for MVP.
- If AI fails, local scorer fallback.
- If turn closes before recommendation, do not submit.
- If auto-vote fails, log failure and notify user.
- Do not block turn resolution on agent commentary.

Recommended architecture later:

- Queue background commentary.
- Keep voting path synchronous and fast.
- Store decision attempts even when failed.

## 10. Agent Rollout Acceptance Criteria

Do not move to auto-vote or paid agents until these are true:

- Users create agents without confusion.
- At least 30% of active voters try recommendation.
- At least 50% of recommendations are manually accepted.
- Agent recommendation endpoint has stable latency.
- Illegal recommendation rate is near zero after validation/fallback.
- No major abuse/spam issue appears in test events.
- Users understand agent decisions from reasoning text.

## Agent Discoverability Plan

Problem:

```text
Agent APIs and pages exist, but normal users may not discover that they can create and use their own AI agent.
```

Required UX entry points:

- Landing page hero CTA: `Create Your Agent`.
- Landing page section: `Build Your Chess Agent`.
- Arena match card link: `My Agents`.
- Voting panel empty state: `Create your first agent`.
- Match lobby CTA: `Bring your agent into any arena`.
- Agents page onboarding and empty state.
- Agent create page templates and preview.

Acceptance criteria:

- User can discover agent creation from landing page within 5 seconds.
- User can discover agent creation from arena without opening docs.
- User without an agent sees an actionable CTA, not a dead empty state.
- User creating an agent can choose a template instead of writing strategy from scratch.
- User can understand recommendation-only vs demo auto-vote.

## New Player Tutorial Plan

Problem:

```text
New users can see the board and controls, but they do not immediately understand what to do first, why pieces are disabled, what the AI does, or how agents fit into the game.
```

Tutorial goal:

```text
A first-time user should understand and submit their first valid action within 60 seconds without external explanation.
```

Required tutorial layers:

- First-time modal.
- Persistent `How to Play` button.
- Contextual hints inside voting UI.
- Mobile-first onboarding layout.
- Standalone `/how-to-play` page.
- Analytics for tutorial completion and drop-off.

## Tutorial Modal MVP

Create:

```text
apps/web/src/components/tutorial/HowToPlayModal.tsx
```

Behavior:

- Show automatically on first arena visit.
- Store completion in `localStorage.chessstake_tutorial_seen`.
- Let users skip.
- Let users reopen from `How to Play` button.
- Track opened, skipped, completed.

Recommended steps:

```text
1. Welcome to ChessStake
2. Choose White or Black
3. Back a legal piece
4. AI resolves the move
5. Optional: use your AI agent
```

Modal copy should be short. Avoid long paragraphs.

## Guided UI Highlights

The tutorial should eventually highlight real UI areas, not only show text.

Target highlights:

- Board.
- Team selector.
- Piece voting grid.
- Timer.
- AI agent panel.
- Reward pool.

MVP can use text-only modal. Next iteration should use highlight anchors.

Potential component API:

```ts
type TutorialStep = {
  title: string;
  body: string;
  target?: 'board' | 'team' | 'pieces' | 'timer' | 'agent' | 'pool';
};
```

## Contextual Hints

Update:

```text
apps/web/src/components/voting/VotingPanel.tsx
apps/web/src/components/voting/VotingTimer.tsx
apps/web/src/components/arena/RewardPoolPanel.tsx
```

Required hints:

- If no team selected: `Start here: choose White or Black.`
- If wrong turn: `Your team is waiting. You can vote when it is your team's turn.`
- If piece disabled: `This piece has no legal move right now.`
- If agent missing: `Create an agent later, or play manually now.`
- Timer: `When time reaches 0, the highest-backed legal piece is resolved by AI.`
- Pool: `MVP mode may use demo accounting unless on-chain mode is enabled.`

## First-Action Checklist

Add a tiny checklist for new users until they submit a first vote.

Checklist:

```text
[ ] Choose a team
[ ] Pick a legal piece
[ ] Wait for AI move
```

Behavior:

- Hide checklist after first successful vote.
- Store in localStorage.
- Keep it compact on mobile.

## Mobile Tutorial Requirements

Mobile is the highest-risk UX because users scroll between board and controls.

Requirements:

- Tutorial button must be visible near board/voting.
- Modal must fit small screens.
- Step text must be short.
- CTA buttons must be thumb-friendly.
- Tutorial should not cover the whole board permanently.
- `Start Playing` should scroll user to voting panel after the modal closes.

## Standalone How-To-Play Page

Create:

```text
apps/web/src/app/how-to-play/page.tsx
```

Sections:

- What is ChessStake?
- How turns work.
- How voting works.
- What AI does.
- What agents do.
- Why some pieces are disabled.
- Demo vs on-chain mode.
- FAQ.

CTAs:

- `Enter Live Arena`
- `Create Agent`
- `View Matches`

## Tutorial Analytics

Use existing endpoint:

```text
POST /api/analytics
```

Track:

- `tutorial_opened`
- `tutorial_step_viewed`
- `tutorial_completed`
- `tutorial_skipped`
- `how_to_play_clicked`
- `first_team_selected_after_tutorial`
- `first_vote_after_tutorial`

Success metrics:

- At least 70% of first-time users complete or skip after reading at least 2 steps.
- At least 50% of first-time users select a team after tutorial.
- At least 25% submit a vote in first session.
- Reduced user questions about “what do I do?” during live tests.

## Tutorial Accessibility

Requirements:

- Modal has proper `role="dialog"`.
- Escape closes modal.
- Buttons are keyboard accessible.
- Focus is trapped inside modal while open.
- Text contrast is readable.
- No instruction relies only on color.

## Tutorial Reset And Persistence

Add:

- `How to Play` button in arena.
- Optional `Reset tutorial` link in `/how-to-play`.
- Store tutorial state per browser using localStorage.

Keys:

```text
chessstake_tutorial_seen
chessstake_first_vote_done
```

## Tutorial Acceptance Criteria

- First-time arena visit shows tutorial.
- Tutorial can be skipped.
- Tutorial can be reopened.
- User understands team selection.
- User understands piece voting.
- User understands AI move resolution.
- User understands agents are optional.
- Mobile user sees voting guidance without excessive scrolling.
- Analytics events are emitted.

## Improved Guided Tutorial Plan

The first tutorial implementation is a basic modal. It is not enough because new players need to know exactly what to do in the actual UI.

New tutorial goal:

```text
Teach the player what to look at, what to click, why something is disabled, and what happens next.
```

## Practical Tutorial Steps

Replace generic slides with action-oriented steps:

```text
1. Look at the board
The board shows the current position. You do not drag pieces manually.
```

```text
2. Choose your team
Click WHITE or BLACK. You can vote only when your team is moving.
```

```text
3. Check whose turn it is
If you joined BLACK but the turn is WHITE, wait for BLACK's turn.
```

```text
4. Choose a piece
Click a legal piece card. The highest-backed piece controls this turn.
```

```text
5. Disabled cards are normal
A card is disabled if that piece cannot legally move or it is not your team's turn.
```

```text
6. Optional: use your agent
Your AI agent recommends a piece. You still confirm before submitting.
```

```text
7. Watch the timer
When the timer hits 0, voting closes.
```

```text
8. AI makes the move
AI picks the best legal move for the winning piece.
```

```text
9. Repeat each turn
The next team gets a turn. Keep voting until the match ends.
```

## Tutorial Modes

Support two tutorial modes:

```text
Quick Start
```

For users who just want to play. 5 short steps.

```text
Full Guide
```

For users who need detailed explanation. Opens `/how-to-play`.

MVP behavior:

- First-time modal shows Quick Start.
- Modal has `Open Full Guide` link.
- Arena has persistent `How to Play` button.

## UI Target Attributes

Add `data-tutorial` attributes so future guided highlights can target real components.

Required targets:

```text
data-tutorial="board"
data-tutorial="team-selector"
data-tutorial="turn-status"
data-tutorial="piece-grid"
data-tutorial="agent-panel"
data-tutorial="timer"
data-tutorial="reward-pool"
data-tutorial="move-history"
```

Files:

```text
apps/web/src/components/arena/LiveChessBoard.tsx
apps/web/src/components/voting/VotingPanel.tsx
apps/web/src/components/voting/VotingTimer.tsx
apps/web/src/components/arena/RewardPoolPanel.tsx
apps/web/src/components/arena/MoveHistoryPanel.tsx
apps/web/src/components/arena/GameStatusPanel.tsx
```

## Context-Aware Tutorial Checklist

The first-turn checklist should change based on user state.

States:

```text
No team selected
```

Show:

```text
Start here: choose WHITE or BLACK.
```

```text
Team selected, wrong turn
```

Show:

```text
You joined BLACK. It is WHITE's turn, so wait for BLACK's turn.
```

```text
Team selected, correct turn
```

Show:

```text
Your team is moving. Pick one legal piece below.
```

```text
Vote submitted
```

Show:

```text
Vote submitted. Wait for the timer and AI move.
```

## Common Confusion Answers

The tutorial and `/how-to-play` page must answer these directly:

```text
Why can't I click a piece?
```

Because it is not your team's turn or that piece has no legal move.

```text
Do I drag the chess pieces?
```

No. You vote for a piece type. AI moves it.

```text
Why did AI choose that square?
```

AI chooses from legal moves for the winning piece using strategy scoring.

```text
What is an agent?
```

An optional helper that recommends what piece to back.

```text
Is this real ETH?
```

MVP may use demo accounting unless on-chain mode is enabled.

```text
Why am I waiting?
```

Your selected team is not currently moving.

## Visual Examples

The tutorial should eventually include small visual examples:

- Example piece card enabled.
- Example piece card disabled.
- Example current turn label.
- Example agent recommendation card.
- Example timer reaching 0.

MVP can use text first. Next iteration can add screenshots or mini cards.

## Mobile-Specific Tutorial Behavior

Mobile tutorial must account for vertical layout.

Requirements:

- After closing tutorial, scroll to voting panel if board is currently visible.
- Keep modal width compact.
- Use short text only.
- Do not require reading a long page before playing.
- Make `How to Play` accessible near the top.

Potential helper:

```ts
document.querySelector('[data-tutorial="piece-grid"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
```

## Desktop-Specific Tutorial Behavior

Desktop tutorial should point out that board and voting are side-by-side.

Required explanation:

```text
The board is on the left. Your action panel is on the right.
```

## Tutorial Reset

Add reset mechanism:

- `/how-to-play` has `Reset tutorial` button.
- Arena `How to Play` button always opens tutorial.
- Optional localStorage reset:

```ts
localStorage.removeItem('chessstake_tutorial_seen')
localStorage.removeItem('chessstake_first_vote_done')
```

## Tutorial QA Script

Manual QA checklist:

- Open arena in fresh browser profile.
- Tutorial opens automatically.
- Step text explains what to do, not just concept.
- Skip closes modal and does not reopen on refresh.
- How to Play reopens modal.
- User can select team after modal.
- Wrong-turn message is clear.
- Disabled piece explanation is visible.
- Mobile: voting appears directly after board.
- `/how-to-play` loads and explains common confusion.
- Analytics calls do not break if API fails.

## Guided Tutorial Edge Cases

Handle these before shipping the guided overlay:

- If a `data-tutorial` target is missing, show the tooltip centered without crashing.
- Recalculate target rectangle on scroll and resize.
- Auto-scroll to the target before measuring it.
- On mobile, keep the tooltip fixed at the bottom so it does not hide the highlighted area.
- On desktop, place the tooltip near the target but clamp it inside the viewport.
- If the target is partially outside the viewport, still highlight the visible position after scrolling.

## Tutorial Success Metrics

Track:

- Tutorial opened.
- Tutorial skipped.
- Tutorial completed.
- Step where users drop off.
- Team selected after tutorial.
- First vote after tutorial.
- How-to-play page visits.
- Agent creation after tutorial.

Success criteria:

- 50%+ first-time users select a team.
- 25%+ first-time users submit a vote.
- Fewer tester questions about what to click first.
- Users can explain the core loop after one tutorial pass.

## Current State

The project already has the technical foundation:

- Live chess board.
- FEN-based game state.
- Legal move validation with `chess.js`.
- Voting by piece type.
- Reward pool display.
- Mock/off-chain betting flow for Vercel.
- PostgreSQL/Prisma game state.
- Demo settlement flow.
- Spectator presence tracking.
- Smart contract for on-chain pool/reward/refund logic.

Current weaknesses:

- Product positioning is still too close to "Web3 AI Chess Betting".
- Landing page explains features but does not sell the business value.
- No creator/streamer mode.
- No match lobby.
- Leaderboard is still a placeholder.
- Voting UI does not feel competitive enough.
- No viral sharing loop.
- No event/tournament loop.
- Business model is not visible in the product experience.

## Target Users

Primary target:

```text
Chess streamers and Web3 gaming communities
```

Secondary target:

- Online chess communities.
- Web3 gaming guilds.
- AI entertainment communities.
- Tournament organizers.
- Sponsors and protocols looking for branded events.

Execution priority:

```text
1. Creators
2. Web3 communities
3. Players
4. Sponsors
```

Reason: creators and communities bring distribution. Acquiring players one by one will be too expensive.

## Business Model

Recommended revenue streams:

- Platform fee from reward pools.
- Creator revenue share.
- Sponsored prize pools.
- Premium creator tools.
- Tournament hosting fee.

Recommended pricing:

```text
Public Arena
Fee: 5% from reward pool
Use case: platform-hosted public matches
```

```text
Creator Arena
Fee: 7.5% from reward pool
Creator share: 3%
Platform share: 4.5%
Use case: streamer/community hosted matches
```

```text
Sponsored Arena
Fee: 5% to 10% from reward pool
Sponsor fee: fixed deal
Use case: branded events and prize pool boosts
```

```text
Creator Pro
Subscription: $19/month to $49/month
Use case: custom branding, private matches, analytics, OBS/Twitch overlay
```

North Star Metric:

```text
Weekly Creator-Hosted Reward Pool Volume
```

Supporting metrics:

- Creator-hosted matches per week.
- Average pool per match.
- Votes per match.
- Returning users.
- Share click rate.
- Match completion rate.
- Platform fee generated.
- Creator revenue generated.

## Product Principles

- Sell creator monetization, not gambling.
- Use "back", "support", "stake", "reward pool", and "community arena" instead of "betting", "gamble", "wager", or "casino".
- Scheduled events should come before always-on random arenas.
- Users should understand why the selected move happened.
- Leaderboards and match history are retention features, not extras.
- On-chain real-money mode should wait for legal review.
- Testnet/play-money mode is enough for early business validation.

## Execution Order

Do not build all phases in parallel. The recommended order is:

```text
Phase 0 -> Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5 -> Phase 6 -> Phase 7
```

Rationale:

- Phase 0 fixes the story before adding more features.
- Phase 1 improves conversion in the core arena.
- Phase 2 adds retention.
- Phase 3 makes the product feel like a platform.
- Phase 4 adds the creator business loop.
- Phase 5 adds growth mechanics.
- Phase 6 improves entertainment and trust.
- Phase 7 should wait until product demand and legal clarity are stronger.

Do not start mainnet/on-chain product completion before:

- Landing and arena positioning are fixed.
- At least one creator-hosted test event has been run.
- Legal/compliance assumptions are documented.
- The team has verified users actually want to participate.

## Core Data Model Direction

The current schema is enough for single-arena demo mode. For the next product version, the data model should support creators, scheduled matches, shareable events, and leaderboard aggregation.

Existing important models:

- `Game`
- `Turn`
- `Bet`
- `Move`
- `PlayerGameState`
- `SpectatorPresence`

Likely new or expanded concepts:

- `Creator`
- `Match` or expanded `Game` metadata
- `ShareEvent`
- `PlayerStats`
- `CreatorStats`
- `Sponsor` or sponsored match metadata

Recommended first step: avoid over-modeling. Extend `Game` first with creator/match metadata before creating too many new tables.

Minimum `Game` additions for product maturity:

```prisma
title          String?
description    String?
creatorName    String?
creatorAddress String?
creatorSlug    String?
isPublic       Boolean  @default(true)
scheduledAt    DateTime?
startedAt      DateTime?
endedAt        DateTime?
creatorFeeBps  Int      @default(0)
sponsorName    String?
sponsorUrl     String?
```

Move to separate `Creator` and `Sponsor` tables only after the product needs reusable profiles.

## API Surface Direction

Current API routes already support the live demo. The next version should make APIs explicit around matches, leaderboard, creator hosting, and sharing.

Recommended new or expanded routes:

```text
GET  /api/matches
POST /api/matches/create
GET  /api/matches/:gameId
GET  /api/leaderboard
POST /api/share-event
GET  /api/creators/:slug
```

Route responsibilities:

- `/api/matches`: list live, upcoming, and completed matches.
- `/api/matches/create`: create creator-hosted or scheduled match.
- `/api/matches/:gameId`: return public match metadata and state summary.
- `/api/leaderboard`: aggregate player, match, and creator stats.
- `/api/share-event`: track share button usage.
- `/api/creators/:slug`: show creator profile and hosted matches.

API responses should avoid leaking unnecessary internal fields. Use explicit response shapes for frontend consumption.

## Analytics Instrumentation

The business plan depends on creator-hosted volume, sharing, and repeat participation. The product should track these from the start.

Events to track:

- `landing_viewed`
- `enter_arena_clicked`
- `host_match_clicked`
- `wallet_connected`
- `team_selected`
- `vote_submitted`
- `vote_failed`
- `turn_resolved`
- `match_finished`
- `claim_checked`
- `claim_completed`
- `share_arena_clicked`
- `share_result_clicked`
- `creator_match_created`
- `match_joined_from_share`

Minimum implementation option:

- Store important product events in the database using a simple `AnalyticsEvent` table.
- Later replace or supplement with PostHog, Plausible, or another analytics tool.

Potential schema:

```prisma
model AnalyticsEvent {
  id        String   @id @default(cuid())
  name      String
  gameId    String?
  address   String?
  sessionId String?
  payload   Json?
  createdAt DateTime @default(now())
}
```

Analytics acceptance criteria:

- Product team can answer how many users entered arena, voted, shared, and returned.
- Creator tests can be evaluated with real data, not feelings.
- Share and host CTAs can be measured.

## Testing And QA Requirements

Before each phase is considered done, run the relevant checks.

Baseline checks:

```text
corepack pnpm@9.0.0 --filter web typecheck
```

Manual QA for every product phase:

- Landing page loads on desktop and mobile.
- Arena loads on desktop and mobile.
- User can select team.
- User can vote only for legal pieces.
- Turn resolves after timer.
- Board updates after move.
- Reward pool updates after vote.
- Spectator count does not break page rendering.
- Claim/reward page still loads.
- No primary UI shows raw wei unless explicitly intended.
- No main marketing surface uses risky betting-heavy wording.

Additional QA for creator/match features:

- Creator can create match.
- Match appears in lobby.
- Match link is shareable.
- Arena displays match title and creator info.
- Completed match appears in history.

Additional QA for leaderboard:

- Leaderboard works with no data.
- Leaderboard works with active data.
- Leaderboard does not expose sensitive information beyond public wallet/address data.

## Launch Readiness Checklist

Before inviting creators or communities, verify:

- Landing page explains the product clearly.
- Arena has a share button.
- Voting UI is understandable without explanation.
- Demo/testnet disclaimer exists but does not dominate the pitch.
- Leaderboard or match result page exists for post-event sharing.
- Host match CTA exists.
- At least one scheduled event is prepared.
- Mobile layout is usable.
- Known failure states have user-friendly messages.
- Environment variables are documented.
- Database migrations/schema changes are applied.
- There is a rollback plan for broken deploys.

## Operations Playbook

For early creator tests, run events manually if needed. Automation can come later.

Pre-event:

- Create or select match.
- Confirm voting timer.
- Confirm reward mode: demo, testnet, or play-money.
- Prepare share link.
- Prepare creator instructions.
- Prepare fallback message if something breaks.

During event:

- Monitor arena state.
- Monitor API errors.
- Watch whether users understand voting.
- Note where users drop off.
- Screenshot good moments.

Post-event:

- Capture match stats.
- Ask creator if they would host again.
- Ask users what was confusing.
- Share result recap.
- Add learnings to next iteration.

Creator test success criteria:

- Creator agrees to run another match.
- At least 30% of live viewers interact with voting.
- Users vote across multiple turns.
- At least 10% of participants click share or ask for another match.
- No critical UX blocker prevents match completion.

## Phase 0: Repositioning And Landing Page

Goal: make the product understandable and sellable.

Files:

```text
apps/web/src/app/page.tsx
apps/web/src/app/layout.tsx
apps/web/src/components/arena/ArenaPage.tsx
```

Tasks:

- Replace "Web3 AI Chess Betting" with "Interactive AI Chess Arena".
- Add creator/community positioning.
- Add CTA for `Enter Arena` and `Host a Match`.
- Add sections for creators, players, game modes, and revenue model.
- Add safer wording around staking and reward pools.
- Reduce visible testnet/demo wording on marketing surfaces.
- Keep legal/demo disclaimers secondary, not as the main pitch.

Suggested hero:

```text
Twitch Plays Chess with Real Stakes
```

Suggested subheadline:

```text
ChessStake lets creators host live AI chess arenas where fans back a team, vote strategy, and share the upside.
```

Acceptance criteria:

- A new visitor can understand who the product is for within 5 seconds.
- The landing page clearly explains why creators would use it.
- The page has a visible `Host a Match` direction, even if the first version is not fully dynamic yet.

## Phase 1: Improve Arena Conversion

Goal: make the live arena feel like an event, not a demo screen.

Files:

```text
apps/web/src/components/arena/ArenaPage.tsx
apps/web/src/components/arena/RewardPoolPanel.tsx
apps/web/src/components/voting/VotingPanel.tsx
apps/web/src/components/arena/GameStatusPanel.tsx
apps/web/src/hooks/useArenaSocket.ts
```

Tasks:

- Add match title, for example `AI Boss Battle #1`.
- Add host/creator identity.
- Add spectator count in the header.
- Add share arena button.
- Add next-match or post-game CTA.
- Format vote amounts as ETH instead of raw wei.
- Add vote progress bars per piece.
- Add `Leading` badge to the highest-backed piece.
- Add `Your Pick` state after user votes.
- Add pool percentage for White vs Black.
- Add reward pool after estimated fee.

Acceptance criteria:

- Voting feels competitive and easy to understand.
- No raw wei is shown in primary UI.
- User can share the arena from the live match page.
- The arena communicates current match context, host, pool, and momentum.

## Phase 2: Real Leaderboard

Goal: add retention and social status.

Files:

```text
apps/web/src/app/leaderboard/page.tsx
apps/web/src/server/game-service.ts
apps/web/src/app/api/leaderboard/route.ts
```

Tasks:

- Replace placeholder leaderboard.
- Add top backers by total amount.
- Add most active voters.
- Add top winning addresses.
- Add biggest pools.
- Add recent winners.
- Add basic player stats.

Suggested leaderboard sections:

- Top Earners.
- Most Active Backers.
- Biggest Supporters.
- Recent Winners.
- Biggest Match Pools.

Acceptance criteria:

- Leaderboard uses real database data.
- It gives users a reason to return.
- It can be shared or used as social proof.

## Phase 3: Match Lobby

Goal: make ChessStake feel like a platform with multiple events.

New files:

```text
apps/web/src/app/matches/page.tsx
apps/web/src/components/matches/MatchCard.tsx
apps/web/src/app/api/matches/route.ts
```

Tasks:

- Add `/matches` page.
- Show live matches.
- Show upcoming scheduled matches.
- Show completed matches.
- Add match cards with title, host, pool, spectators, status, and CTA.
- Link landing page CTA to matches or live arena.

Match card should show:

- Match title.
- Host name.
- Prize pool.
- Spectator count.
- Current status.
- Join button.

Acceptance criteria:

- Product no longer feels like a single hardcoded arena.
- Users can discover live and upcoming matches.
- The page supports future creator-hosted events.

## Phase 4: Creator Mode MVP

Goal: create the first real business loop.

New files:

```text
apps/web/src/app/host/page.tsx
apps/web/src/app/api/matches/create/route.ts
apps/web/src/components/host/HostMatchForm.tsx
```

Potential schema additions:

```prisma
model Creator {
  id        String   @id @default(cuid())
  address   String   @unique
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())
}
```

Potential `Game` fields:

```prisma
creatorId      String?
title          String?
description    String?
isPublic       Boolean  @default(true)
scheduledAt    DateTime?
creatorFeeBps  Int      @default(0)
```

Tasks:

- Add `/host` page.
- Add host match form.
- Save creator name/address.
- Save match title and description.
- Create shareable match link.
- Display creator info in arena.
- Add creator share copy in product.

Acceptance criteria:

- A creator can create or request a hosted match.
- A match has a title, host, and shareable link.
- The arena displays creator identity.
- The feature supports the creator revenue-share narrative.

## Phase 5: Viral Sharing

Goal: make users and creators bring more users.

New file:

```text
apps/web/src/components/share/ShareArenaButton.tsx
```

Tasks:

- Add copy-link button.
- Add X/Twitter intent share.
- Generate share text based on game state.
- Add share result after match ends.
- Add invite-team copy when one side is behind.

Example share copy:

```text
Team White is controlling the board. Join before the next vote closes.
```

```text
Black needs 0.04 ETH to flip the next move. Join the arena.
```

Acceptance criteria:

- Users can share a live match in one click.
- Share copy changes based on match state.
- Result sharing exists after the match ends.

## Phase 6: AI Commentary

Goal: make AI visible as entertainment, not just backend logic.

New files:

```text
apps/web/src/server/ai-commentary.ts
apps/web/src/components/arena/AiCommentaryPanel.tsx
```

Potential schema addition:

```prisma
model Move {
  aiCommentary String?
}
```

Tasks:

- Generate explanation after each resolved move.
- Store commentary with move history.
- Display AI commentary in arena.
- Add match recap after game ends.
- Consider Grok/xAI or Stockfish integration later.

Acceptance criteria:

- Users can understand why a move happened.
- AI has visible personality or strategic explanation.
- Move history becomes more engaging.

## Phase 7: On-Chain Product Completion

Goal: prepare real Web3 mode after product validation and legal review.

Files:

```text
packages/contracts/contracts/PawnPool.sol
apps/web/src/hooks/usePlaceBet.ts
apps/web/src/hooks/useClaimReward.ts
apps/web/src/hooks/useClaimRefund.ts
apps/web/src/server/game-service.ts
```

Tasks:

- Add creator fee support to contract.
- Add creator address per game.
- Split platform fee and creator fee.
- Deploy contract to target testnet.
- Store contract addresses per network.
- Sync contract events to database.
- Enable on-chain place bet.
- Enable on-chain claim reward/refund.
- Add transaction and explorer links.
- Prepare legal/compliance review before mainnet.

Acceptance criteria:

- Testnet on-chain flow works end to end.
- Off-chain database state reconciles with contract events.
- Creator/platform fee split is supported.
- Mainnet launch is blocked until legal review is complete.

## Go-To-Market Plan

### Phase A: Private Creator Test

Target:

- 3 to 5 small chess/Web3 creators.
- 20 to 100 viewers per creator.
- Testnet or play-money mode.

Goal:

- Validate whether audiences vote for multiple turns.
- Validate whether creators want to host again.
- Collect UX feedback.

### Phase B: Weekly Scheduled Event

Format:

```text
ChessStake Friday AI Boss Battle
```

Goal:

- Build a recurring habit.
- Collect clips, screenshots, and testimonials.
- Seed the leaderboard.

### Phase C: Community Vs Community

Format:

```text
Community A vs Community B
```

Goal:

- Use rivalry to increase sharing.
- Increase pool size and viewer retention.

### Phase D: Sponsored Tournament

Format:

```text
Sponsored AI Chess Cup
```

Goal:

- Validate sponsorship revenue.
- Prove the event package can be sold.

## Compliance And Safety

Risks:

- Real-money pool can be treated as gambling in some jurisdictions.
- The word "betting" can create platform, sponsor, and legal friction.
- On-chain mainnet rewards require legal review.
- Trusted backend/operator can create fairness concerns.

Mitigations:

- Use safer wording: back, support, stake, reward pool, strategy arena.
- Start with testnet/play-money events.
- Add clear rules page.
- Add responsible play page.
- Add public vote and move history.
- Add transaction/explorer links for on-chain mode.
- Do not launch mainnet real-money mode before legal review.

## Immediate Execution Checklist

- [ ] Rework landing page positioning.
- [ ] Replace betting-heavy copy.
- [ ] Add `Host a Match` CTA.
- [ ] Add creator/community sections.
- [ ] Add game modes section.
- [ ] Add arena match title and host info.
- [ ] Add share arena button.
- [ ] Format vote amount from wei to ETH.
- [ ] Add vote progress bars.
- [ ] Add leading piece badge.
- [ ] Add reward pool after fee.
- [ ] Replace leaderboard placeholder with real data.
- [ ] Add `/matches` lobby.
- [ ] Add `/host` creator mode MVP.
- [ ] Add AI commentary panel.
- [ ] Plan creator fee split in contract.

## Decisions Before Large Implementation

Recommended defaults:

```text
Initial focus: creators and Web3 communities
Launch mode: testnet/play-money scheduled events
Wording: back/support/reward pool
Creator arena fee: 7.5%
Creator share: 3%
Platform share: 4.5%
Match format: scheduled events first
AI: explanation now, Stockfish/Grok later
First users: small creators and Web3 guilds
```

## Product And Business Maturity Addendum

The existing plan explains what to build, but several assumptions are still unproven. This section defines the missing decisions, experiments, controls, and go/no-go gates needed before ChessStake can become a sustainable product.

## 1. Problem Validation Before Feature Expansion

The core assumption is that creators need a new interactive event format and that their audiences will repeatedly influence a chess match. This must be validated before building tournaments, marketplaces, or autonomous agents.

Hypotheses to test:

| Hypothesis | Cheapest test | Success signal |
|---|---|---|
| Creators want this format | Interview 15 chess/Web3 creators and show a clickable demo | At least 5 agree to run a test event |
| Viewers understand the loop | Moderated test with 20 first-time users | At least 70% submit a valid first vote without verbal help |
| Interaction is repeatable | Run 3 scheduled events | Median voter participates in at least 3 turns |
| Creator distribution works | Give each host a unique invite link | At least 30% of invited visitors enter the arena |
| Creators value monetization tools | Show fee-share and subscription offers | At least 3 creators prefer one offer strongly enough to pilot it |
| The event remains entertaining without cash | Use points and sponsored prizes | Participation does not drop more than 30% versus testnet stake mode |

Required discovery questions:

- What does a creator use today: polls, donations, Discord bots, tournaments, or Twitch extensions?
- Is the main value audience engagement, creator revenue, community rivalry, or prize distribution?
- How long can a live match remain entertaining before viewers leave?
- Does choosing a piece feel meaningful enough, or do users want strategy cards, move candidates, or team chat?
- What prevents a creator from hosting again?
- Does wallet connection reduce participation compared with guest play?

Do not treat wallet connections, page views, or testnet pool volume as proof of willingness to pay.

## 2. Choose One Initial Product Wedge

The plan currently targets chess creators, Web3 communities, AI communities, sponsors, and tournament organizers. That is too broad for the first launch.

Recommended first wedge:

```text
Small Web3 creators and communities that already run scheduled online events,
using sponsored points or non-cash prizes and no mandatory wallet for first participation.
```

Why this wedge:

- Existing distribution and community identity.
- Familiarity with wallets, but guest onboarding can still reduce friction.
- Easier access to protocol sponsors and prize boosts.
- Scheduled events solve the empty-arena and liquidity problem.

Explicit non-targets for the first three pilots:

- General chess players acquired through paid ads.
- Professional chess tournaments requiring federation-grade rules.
- Real-money public betting users.
- Fully autonomous trading-style agent users.

After three pilots, compare a second wedge of chess streamers using the same activation and retention metrics.

## 3. Product Mode And Legal Architecture

Changing words from `bet` to `back` does not change the legal substance. A pooled contribution with an uncertain payout may still be regulated as gambling, wagering, a contest, or a financial product depending on jurisdiction.

ChessStake should be designed as separate product modes rather than one ambiguous mode:

| Mode | User payment | Reward | Recommended use |
|---|---|---|---|
| Free Play | None | Points, badges, rank | Public acquisition and onboarding |
| Sponsored Event | None or free entry | Sponsor-funded fixed prizes | First commercial pilots |
| Testnet Lab | Testnet token | Testnet reward | Technical and contract testing |
| Paid Creator Tool | Creator pays SaaS/event fee | No pooled player payout required | Lower-risk B2B monetization |
| Real-Money Pool | User funds | Variable pooled payout | Blocked pending jurisdiction-specific legal approval |

Rules:

- Every match must expose its mode, reward source, fee, eligibility, jurisdiction restrictions, and settlement rules before participation.
- Free and sponsored modes must not silently reuse real-money language or accounting assumptions.
- Sponsored prizes should be fixed and funded before an event, not dependent on participant losses.
- Mainnet mode requires legal opinions for launch jurisdictions, age gating, geofencing, sanctions screening, responsible-play controls, tax analysis, and written incident/complaint procedures.
- Terms of Service, Privacy Policy, Contest Rules, Responsible Play, and creator/sponsor agreements need named owners and versions.
- Marketing copy must be reviewed for substance, not only terminology.

Recommended commercial sequence:

```text
Free engagement -> sponsored fixed-prize events -> paid creator tooling ->
jurisdiction-limited real-money pilot only if legally approved
```

## 4. Value Proposition By Stakeholder

### Creator

Job to be done: turn a passive stream or community call into a repeatable interactive event without operating game infrastructure.

Minimum creator value:

- Create and schedule a match in under 5 minutes.
- Share one guest-friendly link.
- Use an OBS/browser overlay.
- Moderate, pause, cancel, and communicate incidents.
- See live engagement and post-event analytics.
- Export a recap and understand revenue owed.

### Participant

Job to be done: influence a live team outcome, understand why it happened, and build status over time.

Minimum participant value:

- Join as spectator without wallet.
- Understand the first action in under 60 seconds.
- See exactly how their action affected the turn.
- Trust rules, tally, move selection, and rewards.
- Keep identity/reputation across events without exposing unnecessary wallet data.

### Sponsor

Job to be done: fund an interactive community event with measurable exposure and brand safety.

Minimum sponsor value:

- Clear inventory: naming rights, overlay, prize boost, recap, and CTA.
- Verified reach, unique participants, interactions, watch time, and click-through.
- Brand-safety and fraud report.
- Post-event report delivered within 48 hours.

## 5. Revenue Model Priorities

Do not rely on reward-pool take rate as the only or first revenue source. It creates regulatory exposure and weak revenue when liquidity is low.

Recommended priority:

1. Sponsored event package.
2. Fixed creator/event hosting fee.
3. Creator Pro subscription after repeat usage is proven.
4. Optional fee share in legally permitted modes.
5. Agent subscriptions and cosmetics only after agent retention is proven.

Proposed pilot offers:

| Offer | Buyer | Initial price hypothesis | Included |
|---|---|---:|---|
| Community Pilot | Creator/community | Free for first event | Hosted setup, basic overlay, recap |
| Hosted Event | Creator/community | $49-$149 per event | Scheduling, branding, moderation, analytics |
| Sponsored Battle | Protocol/brand | $500-$2,500 per event | Prize funding separate, branded arena, report |
| Creator Pro | Repeat creator | $19-$49 per month | Self-serve hosting, overlays, history, analytics |

Prices are hypotheses, not final pricing. Test fixed fees before building billing automation. Use invoices or manual payment for pilots.

Avoid double charging without clear value. If a creator pays a hosting fee, participant pool fees should be lower or absent. Display the complete fee split before users act.

## 6. Complete Unit Economics

Pool volume is not revenue, and gross platform fee is not contribution margin.

Track per event:

```text
Gross revenue
= event hosting fee
+ sponsor fee
+ platform share of permitted pool fee
+ subscription revenue allocated to the event

Variable cost
= chain gas subsidized by platform
+ RPC and indexing
+ database/realtime usage
+ AI inference
+ prize subsidy
+ creator payout
+ payment processing
+ support/moderation time
+ fraud losses and refunds

Contribution margin = gross revenue - variable cost
```

Required unit metrics:

- Revenue per hosted event.
- Contribution margin per event.
- Creator acquisition cost and payback period.
- Creator activation rate: signed up to first completed event.
- Creator repeat rate within 30 days.
- Cost per active participant.
- Sponsor renewal rate.
- Refund, failed settlement, and support-ticket rate.
- AI cost per completed match.
- Infrastructure cost per concurrent spectator.

Initial guardrails:

- Positive contribution margin excluding intentional pilot subsidy by the tenth paid event.
- Creator acquisition payback below three months for subscription customers.
- AI and infrastructure cost below 10% of net event revenue.
- Platform-funded prize subsidy has a fixed monthly cap and a measured acquisition purpose.

## 7. Match Economics And Game Design Gaps

The current piece prices create pay-to-control behavior: expensive piece votes carry more tally weight because price and influence are coupled. Wealthy users can repeatedly determine strategy, while cheaper pieces may be structurally disadvantaged. This can reduce fun and undermine the claim of crowd control.

Decisions required:

- Is each action one equal vote, or is influence proportional to money?
- Why should Queen cost more, and does that produce better gameplay?
- Can one wallet dominate every turn?
- Can a participant join late after seeing which side is winning?
- Does team lock create balanced teams or trap users in an inactive side?
- Who funds rewards in free/sponsored modes?
- What happens if only one team has participants?

Recommended experiments:

| Mechanic | Variant A | Variant B | Measure |
|---|---|---|---|
| Influence | One person, one vote | Quadratic/capped stake weight | Participation concentration and satisfaction |
| Piece selection | Equal price | Price by tactical power | Piece diversity and perceived fairness |
| Team assignment | User choice | Auto-balance parties | Team balance and completion |
| Reward | Winner pool | Points plus fixed sponsor prizes | Repeat participation and legal complexity |
| Turn length | 20 seconds | 30-45 seconds | Vote rate, latency failures, stream pacing |

Recommended free/sponsored MVP:

- Equal vote weight per verified session or account.
- Optional points budget, not money, for strategic allocation.
- Per-turn and per-match influence caps.
- Fixed sponsor-funded rewards based on published contest rules.
- Separate competitive ranking from financial ROI.

## 8. Market Integrity And Abuse Controls

Wallet-based identity alone does not prevent Sybil attacks. Public live tallies also enable last-second sniping, and creator-controlled games introduce conflict-of-interest risks.

Threat model must cover:

- Multi-wallet Sybil voting.
- Creator or operator betting in their own match.
- Insider knowledge of resolver, pause, or cancellation decisions.
- Last-second vote sniping and chain confirmation races.
- Collusion between accounts or teams.
- Wash activity to inflate pools and leaderboards.
- Referral fraud and fake spectators.
- Malicious creator names, links, chat, or agent prompts.
- DDoS during scheduled events.
- Compromised operator, treasury, or creator wallet.

Minimum controls before public reward events:

- Published operator and creator participation policy.
- Per-account, per-device, and per-IP velocity signals with privacy review.
- Configurable stake/influence limits.
- Commit/reveal or hidden tally experiment if sniping materially affects outcomes.
- Immutable per-turn audit record: inputs, tally, legal candidates, resolver version, selected move, and timestamps.
- Separation between creator controls and settlement authority.
- Multisig for admin/treasury and key-rotation runbook.
- Fraud review queue and documented disqualification/refund process.
- Leaderboards exclude flagged, demo, operator, and test accounts.

## 9. Trust, Fairness, And Verifiability

The product must clearly disclose that the backend currently coordinates game state and move resolution. On-chain escrow does not make off-chain game outcomes trustless.

Add a public fairness page containing:

- Complete game and settlement rules.
- Resolver name and version used by each match.
- Legal move validation method.
- Tie-break and fallback behavior.
- Fee and prize calculation examples.
- Operator powers and emergency conditions.
- Contract address, deployment, audit status, and known limitations.
- Downloadable match transcript or audit JSON.

For every completed match, retain:

```text
initial FEN + all turn windows + aggregate votes + legal candidates +
resolver input/output + move history + settlement calculation + admin actions
```

Never market the system as decentralized or trustless while an operator can resolve, cancel, mark late transactions, or choose game outcomes without an independently verifiable policy.

## 10. Creator Operations And Marketplace Governance

Creator mode is not only a form and fee split. It requires a supply-side operating system.

Creator lifecycle:

```text
Lead -> qualified -> approved -> onboarded -> first event ->
repeat host -> paid creator -> sponsor-ready creator
```

Required capabilities:

- Creator application and approval for early pilots.
- Identity, payout details, sanctions eligibility, and tax information where applicable.
- Revenue statement and payout status.
- Content and brand guidelines.
- Event cancellation and no-show policy.
- Moderation controls and escalation contact.
- Sponsor conflict and category-exclusivity rules.
- Service-level expectations for paid events.
- Creator quality score based on completion, attendance, incidents, and repeat rate.

Do not make creator hosting fully permissionless until abuse, settlement, and support procedures are proven.

## 11. Distribution And Growth Measurement

Each acquisition channel needs attribution and an owner. Generic sharing buttons are not a growth strategy.

Channel experiments:

| Channel | Experiment | Primary metric |
|---|---|---|
| Creator audience | Unique creator invite link and scheduled stream | Activated participants per creator |
| Community Discord | Reminder bot plus event role | RSVP-to-participant conversion |
| X/Twitter | Dynamic result card | Qualified arena visits per post |
| Sponsor community | Co-branded event | New participant activation and sponsor leads |
| Referral | Team invite link | Incremental activated users, excluding fraud |

Define the funnel:

```text
Invitation seen -> landing visit -> arena entry -> first team choice ->
first valid vote -> third vote -> match completion -> result share -> next event return
```

Core definitions:

- Activated participant: submits at least one valid action.
- Engaged participant: submits valid actions in at least three turns.
- Retained participant: joins another match within 30 days.
- Activated creator: completes a match with at least 10 activated participants.
- Retained creator: hosts another match within 30 days.

Avoid using total wallet count, gross pool, or spectator websocket connections as standalone success metrics.

## 12. North Star And KPI Tree

Replace `Weekly Creator-Hosted Reward Pool Volume` as the only North Star because it rewards money movement without proving user value and may incentivize wash activity.

Recommended North Star for the validation stage:

```text
Weekly Engaged Participants in Completed Creator-Hosted Matches
```

Business companion metric:

```text
Monthly Retained Creators with Positive-Contribution Events
```

KPI tree:

- Supply: approved creators, activated creators, retained creators, events per creator.
- Demand: invited visitors, activated participants, engaged participants, 30-day retention.
- Experience: first-action time, vote error rate, match completion, median turns participated, satisfaction.
- Growth: invite conversion, share conversion, organic participant percentage.
- Revenue: event revenue, sponsor revenue, MRR, platform fee revenue.
- Economics: contribution margin, CAC, payback, prize subsidy, support cost.
- Trust: disputed events, refunds, flagged activity, settlement time, incidents.

## 13. Analytics, Privacy, And Experimentation

The analytics plan needs event definitions and privacy rules, not only event names.

Requirements:

- Version every event schema.
- Use server-side truth for votes, match completion, fees, and settlement.
- Generate anonymous session IDs for guests.
- Keep wallet address pseudonymous and avoid exposing raw addresses unnecessarily.
- Define retention and deletion periods.
- Support consent requirements by jurisdiction.
- Exclude team/admin/test traffic from business dashboards.
- Add experiment assignment fields so A/B tests are reproducible.
- Never store private keys, signatures beyond operational need, or sensitive agent prompts in analytics payloads.

Minimum dashboards:

- Creator acquisition and activation funnel.
- Participant first-action funnel.
- Per-event engagement and completion.
- Cohort retention by creator and acquisition channel.
- Event unit economics.
- Reliability, fraud, refund, and support incidents.

## 14. Reliability And Event Operations

A scheduled live product fails differently from a normal website: one outage can ruin a creator relationship and sponsor event.

Service objectives for paid pilots:

- Arena/API availability during event window: at least 99.9% measured per event.
- Vote acknowledgement p95 under 1 second off-chain.
- Board update p95 under 2 seconds after resolution.
- No accepted vote lost during reconnect.
- Settlement status visible within 5 minutes after match completion.

Required runbooks:

- Failed AI/resolver.
- Database or realtime outage.
- Chain/RPC degradation.
- Stuck or late transaction spike.
- Incorrect result or settlement dispute.
- Creator no-show.
- Abusive content or participant.
- Key compromise.
- Full event cancellation and participant communication.

Every admin action must be authenticated, authorized, logged, attributable, and reviewable. Paid/sponsored events need a named on-call operator until automation is proven.

## 15. Security And Contract Readiness Gates

Existing unit tests are not equivalent to a production security review.

Before any mainnet or valuable-prize launch:

- Write explicit smart-contract invariants and add fuzz/property tests.
- Test rounding dust, zero pools, one-sided pools, mixed late refunds, paused states, and malicious receiver contracts.
- Review role escalation, operator compromise, treasury failure, and emergency recovery.
- Use multisig and hardware-backed keys for admin and treasury.
- Add deployment reproducibility and verified source code.
- Obtain independent contract and backend security reviews.
- Set a maximum value at risk per game and globally.
- Add pause criteria and a public disclosure process.
- Fund a bug bounty appropriate to value at risk.

Product launch limits must be configurable without contract redeployment where safe:

- Maximum pool per game.
- Maximum user contribution.
- Maximum concurrent games.
- Approved creators and jurisdictions.
- Approved token and chain.

## 16. Ownership And Team Capacity

The roadmap currently lists features but not accountable owners. Assign one directly responsible owner to each workstream:

| Workstream | Required owner |
|---|---|
| Product and user research | Product lead |
| Creator acquisition and event operations | Growth/operations lead |
| Sponsorship sales | Business lead |
| Game integrity and risk | Product/risk owner |
| Legal and privacy | Qualified external counsel plus internal owner |
| Smart contract and backend security | Engineering/security owner |
| Reliability and incident response | Engineering owner |
| Analytics and unit economics | Product/data owner |

If the team is small, one person may own multiple workstreams, but no workstream should be implicitly owned by “the team.”

## 17. Revised Validation Roadmap

### Gate 0: Concept Validation, No New Platform Features

Duration target: 2 weeks.

- Interview 15 target creators.
- Test the current arena with 20 first-time participants.
- Select one wedge and one primary value proposition.
- Choose Free Play and Sponsored Event as initial product modes.
- Obtain preliminary legal issue-spotting before selling reward-based events.

Exit criteria:

- At least 5 creators agree to a pilot.
- At least 70% of users understand and complete a first action.
- One monetization offer receives credible buyer interest.

### Gate 1: Concierge Creator Pilot

Duration target: 3-4 weeks.

- Run three manually operated scheduled events.
- Add only essential creator metadata, share links, onboarding, analytics, and operator controls.
- Use guest access, points, or pre-funded fixed prizes.
- Measure the complete funnel and event cost.

Exit criteria:

- Three events complete without critical integrity failures.
- At least 30% of attendees become activated participants.
- Median activated participant acts in at least three turns.
- At least two of three creators want to host again.
- One creator, community, or sponsor is willing to pay for the next event.

### Gate 2: Repeatable Hosted Product

- Build self-serve scheduling only for validated creator needs.
- Add OBS overlay, moderation, event recap, creator dashboard, and manual billing.
- Package Hosted Event and Sponsored Battle offers.
- Establish support and incident runbooks.

Exit criteria:

- Five paid or sponsor-funded events complete.
- At least 40% creator 30-day repeat rate.
- Positive contribution margin on at least three events excluding intentional subsidies.
- No unresolved reward or integrity dispute.

### Gate 3: Retention Features

- Build leaderboard, season, agent recommendation, and richer commentary based on observed retention problems.
- A/B test each feature against repeat participation, not novelty clicks.

Exit criteria:

- Participant 30-day retention improves meaningfully versus the pilot baseline.
- Agent recommendation has at least 30% trial and 50% manual acceptance among eligible users before monetization.

### Gate 4: Regulated Value Mode

- Select launch jurisdiction and legal classification.
- Implement required age, location, identity, sanctions, tax, responsible-play, and dispute controls.
- Complete security review and cap value at risk.
- Run a closed, jurisdiction-limited pilot.

Exit criteria:

- Written legal approval for the precise product flow and jurisdictions.
- Independent security review findings resolved.
- Operational, financial, and incident controls tested end to end.

## 18. Stop Conditions

Pause or pivot the concept if, after the first three pilots:

- Fewer than 30% of attendees take one valid action.
- Median participant acts in fewer than two turns.
- Fewer than two creators want to host again.
- No buyer shows willingness to pay for hosting, sponsorship, or creator tools.
- Wallet or reward complexity is the dominant reason for abandonment and guest mode does not solve it.
- Match duration consistently exceeds audience tolerance.
- Fraud, legal, or support cost makes positive contribution margin implausible.

Possible pivots:

- B2B interactive stream tool with points and no pooled money.
- Sponsored community tournament platform.
- Crowd-vs-agent entertainment product.
- White-label audience voting engine for games beyond chess.

## 19. Open Decision Register

These decisions must be recorded with owner, deadline, evidence, and chosen outcome:

| Decision | Recommended default | Deadline |
|---|---|---|
| First customer segment | Small Web3 creators/communities | Before Gate 0 ends |
| Initial product modes | Free Play and Sponsored Event | Before first pilot |
| Primary buyer | Creator/community organizer first, sponsor second | Before pricing test |
| Vote influence | Equal or capped weight for non-cash MVP | Before next game-design build |
| Guest identity | Anonymous session with optional account/wallet upgrade | Before onboarding work |
| Brand name | Choose ChessStake or PawnPool consistently | Before public outreach |
| Fee model | Fixed event fee first; pool fee only where permitted | Before billing work |
| Creator payout | Manual invoiced payout during pilots | Before first paid event |
| AI claim | `Strategy resolver` until real model capabilities are live | Immediately |
| Backend source of truth | Next.js/Vercel or dedicated realtime backend, not both | Before scaling events |
| Launch geography | One counsel-approved jurisdiction | Before any value mode |

## 20. Immediate Next Actions

- [ ] Name an owner for product discovery, creator pilots, legal, and engineering reliability.
- [ ] Choose one brand name and update future documentation accordingly.
- [ ] Create a 15-creator interview list and interview script.
- [ ] Recruit 20 first-time usability testers.
- [ ] Define Free Play and Sponsored Event rules separately.
- [ ] Decide equal versus money-weighted influence for the next pilot.
- [ ] Instrument the full participant and creator funnels with event definitions.
- [ ] Build a per-event unit economics spreadsheet before adding billing code.
- [ ] Prepare creator, participant, and sponsor pilot offers.
- [ ] Add an event operations and incident runbook.
- [ ] Run three concierge events before building autonomous agents or tournament infrastructure.
- [ ] Record results against Gate 1 criteria and make an explicit continue, pivot, or stop decision.

## Strategic Blind Spots Addendum

The maturity addendum defines validation and operating gates. The following areas still need explicit strategy before ChessStake can support an investment case, long-term roadmap, or scalable commercial launch.

## 21. Entertainment Thesis And Core Fun

The product currently explains mechanics better than it explains why a participant would enjoy the tenth match. Financial upside, AI branding, and creator presence can attract initial attention, but they are not a durable game loop by themselves.

Core entertainment promise:

```text
Make a fast team decision, see visible consequences on the board,
celebrate or blame the crowd, and return for the next decisive moment.
```

Each turn should deliver four beats:

```text
Understand the threat -> debate a choice -> reveal the crowd decision ->
watch and understand the consequence
```

Concept gaps to validate:

- Voting for a piece type may be too abstract for non-chess users.
- A full chess match may be too long for a live audience.
- Users on the inactive team may have long periods with nothing to do.
- Strong players may dislike losing control to uninformed voters.
- New players may not understand whether a resulting move was good or bad.
- A dominant team or board position may remove suspense too early.
- Repeated 20-second cycles may become monotonous without event pacing.

Prototype these formats before expanding infrastructure:

| Format | Description | Question answered |
|---|---|---|
| Piece Vote | Current mechanic | Is simple choice enough? |
| Strategy Vote | Attack, defend, trade, develop, protect king | Is intent easier than chess notation? |
| Candidate Move Vote | AI offers 2-3 legal moves with explanations | Does more control improve trust and fun? |
| Power Turn | Community earns one special high-impact vote per match | Does scarcity create memorable moments? |
| Crowd vs Boss | Crowd faces a named AI with phases/personality | Is a clear antagonist more entertaining? |
| Blitz Scenario | Start from a tactical FEN and finish in 10-20 turns | Does a shorter format improve completion? |

Recommended pilot format:

```text
15-25 minute scheduled scenario match, candidate or strategy voting,
both teams receive a meaningful interaction every 30-60 seconds,
and commentary explains every reveal.
```

Fun metrics:

- Median active minutes per participant.
- Turns participated per active minute.
- Percentage staying through match end.
- Percentage reacting, sharing, or inviting after a decisive turn.
- Post-match `Would you play again?` score.
- Percentage who can recall one memorable match moment.
- Creator dead-air time and commentary burden.

## 22. Market Map And Competitive Alternatives

Market sizing should be bottom-up. A broad label such as Web3 gaming, online chess, or creator economy overstates the reachable market.

Competitive alternatives include more than direct AI chess products:

- Twitch/YouTube polls and chat commands.
- Twitch Plays-style community bots.
- Lichess and Chess.com tournaments.
- Discord tournament and engagement bots.
- Prediction markets and fantasy games.
- Stream donations, channel points, raffles, and giveaways.
- Jackbox-style audience participation tools.
- Custom branded microsites built by agencies.
- Doing nothing and running a normal stream.

Build a competitor matrix using:

| Dimension | Why it matters |
|---|---|
| Setup time | Creator switching friction |
| Guest participation | Audience conversion |
| Stream integration | Creator workflow fit |
| Strategic depth | Repeat entertainment |
| Monetization | Buyer ROI |
| Moderation | Operational safety |
| Verifiability | Reward trust |
| Price | Willingness to switch |
| Audience ownership/export | Creator control |

Bottom-up market model:

```text
Serviceable creators
x realistic hosted events per creator per year
x net platform revenue per event
+ sponsor package revenue
+ creator subscription revenue
= serviceable annual revenue opportunity
```

Use three cases:

| Case | Creator count | Events/year | Net revenue/event | Annual revenue |
|---|---:|---:|---:|---:|
| Conservative | Research input | Research input | Pilot result | Calculated |
| Base | Research input | Research input | Pilot result | Calculated |
| Upside | Research input | Research input | Pilot result | Calculated |

Do not publish TAM/SAM/SOM until creator counts, event frequency, and realized pricing have cited sources or pilot evidence.

Research deliverables:

- Interview at least five users of each major alternative.
- Document why they would switch and why they would not.
- Record competitor pricing and platform dependencies quarterly.
- Identify whether ChessStake is replacing a poll, a tournament, a giveaway, or an entire event workflow.

## 23. Defensibility And Moat

Chess rendering, wallet connection, LLM commentary, and voting are replicable features. A token is not a moat. The defensibility thesis should be based on compounding assets.

Potential moat stack:

1. Creator workflow: fastest path from event idea to safe, measurable live event.
2. Distribution network: repeat creators, communities, sponsors, and cross-community match supply.
3. Proprietary format knowledge: data on pacing, scenarios, voting formats, and retention.
4. Reputation graph: portable creator, participant, team, and agent history with anti-fraud quality.
5. Sponsor measurement: credible engagement benchmarks and repeatable inventory.
6. Operational trust: reliable settlement, moderation, integrity, and event execution.
7. Content library: reusable licensed scenarios, AI bosses, overlays, and event templates.

Moat milestones:

- 20 retained creators with repeat event history.
- A benchmark dataset linking formats to completion and retention.
- Sponsor renewal and creator-to-creator referral become material acquisition channels.
- More than half of events use templates, reputation, or network matching unavailable from a generic poll tool.
- Creators would lose meaningful history, workflow, or distribution value by switching.

Avoid premature marketplace claims. Network effects only exist if each additional creator, participant, or sponsor measurably improves value for others.

## 24. Cold-Start And Supply Strategy

ChessStake can become a multi-sided marketplace involving creators, audiences, sponsors, and possibly agents. Launching an empty self-serve lobby would expose the cold-start problem rather than solve it.

Initial managed supply strategy:

- Recruit a cohort of 5-10 creators instead of opening globally.
- Offer two fixed weekly event slots to concentrate demand.
- Platform produces scenarios, overlays, moderation, and recaps.
- Cross-match participants are invited to the next scheduled event.
- Match communities with similar audience size manually.
- Sell sponsor inventory across a season rather than one isolated event.

Liquidity hierarchy:

```text
One excellent scheduled event
-> recurring weekly slate
-> curated creator season
-> invite-only self-serve hosting
-> open marketplace only after demand density exists
```

Marketplace health metrics:

- Fill rate of scheduled event slots.
- Median activated participants per event.
- Creator wait time to host.
- Sponsor inventory sell-through.
- Percentage of events meeting minimum audience threshold.
- Cross-event participant migration.
- Concentration of activity among top creators.

Set minimum launch conditions for a public lobby: at least three upcoming events at any time and one predictable recurring event. Otherwise show one focused schedule, not an empty marketplace.

## 25. Sponsor Product And ROI

Sponsorship needs a defined media product, not only a logo and prize boost.

Sellable inventory:

- Event naming rights.
- Pre-match card and countdown placement.
- Board-side or overlay placement.
- Sponsored AI boss/personality.
- Branded strategy card or non-gameplay cosmetic.
- Prize presentation.
- Post-match recap and result card.
- Creator mention with disclosure.
- Opt-in sponsor CTA and landing-page click.
- Season sponsorship across several events.

Never sell influence over legal moves, outcomes, resolver behavior, or hidden user data.

Sponsor report definitions:

- Unique verified viewers, not socket connections.
- Activated and engaged participants.
- Median active time.
- Sponsor impressions with a defined viewability rule.
- CTA clicks and conversion where available.
- Creator content reach reported separately from platform reach.
- Fraud-filtered totals and methodology.
- Brand-safety incidents.

Commercial terms must define:

- Inventory and deliverables.
- Prize funding versus platform fee.
- Payment schedule and currency risk.
- Creator disclosure obligations.
- Data available to sponsor.
- Cancellation, underdelivery, and make-good policy.
- Content approval deadline.
- Category exclusivity.
- IP usage period for clips, logos, and creator likeness.

Sponsor validation target: secure one paid pilot and one renewal before building a sponsor dashboard.

## 26. Reward And Token Strategy

ChessStake does not need a native token for product validation. Introducing one early adds speculation, liquidity, securities, treasury, and governance complexity without proving entertainment value.

Default strategy:

```text
No native token before repeat product usage and qualified legal analysis.
```

Reward hierarchy:

1. Non-transferable points, badges, team reputation, and cosmetic unlocks.
2. Sponsor-funded fixed prizes with published eligibility.
3. Stable-value rewards where legally and operationally permitted.
4. Native crypto pools only after security and legal gates.

Points policy must define:

- How points are earned and whether they expire.
- Anti-farming and account rules.
- No promise of future monetary conversion.
- Season resets and historical badges.
- Corrections after fraud or game cancellation.
- Separation between engagement points and financial balances.

If stablecoin mode is considered later, compare it with native ETH on:

- User price clarity.
- Volatility during long matches.
- Chain liquidity and wallet support.
- Gas sponsorship/account abstraction.
- Contract risk and token allowlisting.
- Accounting and sanctions requirements.

Never fund rewards primarily through continuous token issuance. Every reward program needs a named budget source, cap, objective, and end date.

## 27. Treasury, Cash Flow, Accounting, And Tax

The business needs an operational ledger separate from game-state tables and blockchain events.

Track distinct balances:

- Customer/player funds held in escrow.
- Sponsor prize funds restricted to an event.
- Creator payable.
- Refund liability.
- Platform-earned revenue.
- Platform-funded subsidy.
- Gas and vendor expense.
- Unclaimed rewards and treatment after expiry.

Financial controls:

- Never recognize escrowed pool value as platform revenue.
- Reconcile contract, database, bank/payment account, and creator statements.
- Use dual approval for treasury movement above a threshold.
- Define creator payout schedule, minimum payout, currency, and network fees.
- Define refund reserves and cash buffer.
- Record exchange rates and timestamps for crypto-denominated transactions.
- Produce a per-event settlement statement.
- Separate production, prize, operating, and treasury wallets/accounts.
- Retain evidence required for tax and sponsor invoices.

Monthly finance close should answer:

```text
Opening liabilities + funds received - rewards paid - refunds paid -
creator payables - recognized platform revenue = closing reconciled balances
```

Before paid operation, obtain accounting advice for revenue recognition, crypto valuation, creator reporting, prize taxation, VAT/GST/sales tax, and unclaimed property rules in applicable jurisdictions.

## 28. Customer Support And Dispute Resolution

Trust requires a user-facing process, not only internal runbooks.

Support categories:

- Cannot join, vote, or reconnect.
- Wrong team or misunderstood team lock.
- Vote accepted but not counted.
- Late transaction or network fee complaint.
- Reward/refund eligibility dispute.
- Creator cancellation or sponsor prize issue.
- Account restriction or fraud appeal.
- Offensive content or harassment report.
- Privacy or data deletion request.

Minimum support system:

- In-product event ID, turn ID, transaction ID, and `Report issue` action.
- Searchable rules and status page.
- Ticket intake with severity and evidence fields.
- Response targets by event type.
- Escalation from support to integrity, engineering, finance, or legal.
- Written appeal and final-decision process.
- Incident communication template and postmortem for material failures.

Suggested service levels for pilots:

| Severity | Example | Initial response |
|---|---|---|
| Critical | Wrong settlement, funds at risk, event-wide outage | 15 minutes during event |
| High | Many users cannot vote | 30 minutes during event |
| Normal | Individual vote/reward question | 1 business day |
| Privacy/legal | Data or eligibility request | Per applicable legal deadline |

Publish who has final authority over game results and what evidence can change a result. Do not improvise settlement decisions in private messages.

## 29. Community Safety, Accessibility, And Localization

The product includes rivalry, financial incentives, creator audiences, and AI-generated text. This creates harassment and unsafe-content risks even without chat.

Community safety requirements:

- Community code of conduct.
- Creator and agent naming/content policy.
- Reporting, blocking, suspension, and appeal process.
- AI commentary filters and safe fallback templates.
- No personalized financial pressure, loss chasing, or humiliating commentary.
- Controls for creator links and sponsor content.
- Minor protection and age-appropriate free mode.
- Rate limits for usernames, referrals, and generated content.

Accessibility extends beyond the tutorial:

- Keyboard-operable board alternatives and controls.
- Screen-reader labels for board state, turn, timer, and vote status.
- Do not rely on color for White/Black, leading state, or profit/loss.
- Reduced-motion option for board animations and countdown effects.
- Captions/text equivalents for live commentary and sound cues.
- Timer accommodations where rules permit.
- WCAG 2.2 AA target for core participant and creator flows.

Localization strategy:

- Start with English plus the language of the first creator cohort, likely Indonesian.
- Externalize product copy, rules, dates, numbers, and currencies.
- Use human review for legal, reward, and safety copy.
- Localize chess terminology with community testers.
- Do not open a jurisdiction merely because the interface is translated.

## 30. Identity And Reputation Portability

Wallet-only identity creates fragmented profiles and poor recovery; account-only identity weakens Web3 portability. Use progressive identity.

Recommended model:

```text
Guest session -> verified email/social or passkey account -> optional linked wallets
```

Principles:

- One profile may link multiple wallets after proof of control.
- Changing a wallet must not erase legitimate non-financial reputation.
- Financial claims remain bound to the authorized wallet or an explicit secure migration flow.
- Public profiles use display names and truncated addresses by default.
- Reputation separates play, creator, sponsor, agent, and integrity dimensions.
- Users can export account and match history where practical.
- Account recovery must not allow support staff to redirect on-chain funds.

Do not create tradable reputation or agent assets until impersonation, recovery, licensing, and marketplace fraud are addressed.

## 31. IP, Licensing, And Content Rights

Before commercial use, verify rights for every external asset and generated output.

Required IP register:

- Chess board and piece images from `maapcaturrr` with source and license evidence.
- Fonts, icons, music, sound effects, and UI assets.
- Stockfish and all open-source dependencies with license obligations.
- Creator names, logos, clips, voice, and likeness permissions.
- Sponsor marks and campaign usage windows.
- AI model provider terms for generated commentary and training/data use.
- User-created agent names, prompts, descriptions, and shared content.

Business requirements:

- Run a trademark/name search before committing to `ChessStake` or `PawnPool`.
- Define whether creators grant the platform rights to clip and redistribute event content.
- Define whether players grant rights to public match actions and display names.
- Prohibit agents that impersonate real people or infringe brands.
- Provide takedown and repeat-infringer procedures.
- Avoid using a creator's likeness in sponsor materials without explicit approval.

## 32. Platform And Vendor Dependency Risk

Distribution may depend on Twitch, YouTube, Discord, X, wallet providers, Vercel, Neon, RPC providers, AI APIs, and app stores. Their policies can limit gambling-adjacent content, automated activity, crypto promotion, data use, or embedded transactions.

Before integration or campaign launch:

- Review platform terms for interactive extensions, crypto, contests, and promotions.
- Confirm creator disclosure and sponsored-content requirements.
- Avoid claiming an official partnership without written permission.
- Maintain email/community channels not controlled by one platform.
- Support export of creator schedule, participants, and event results.
- Define fallback providers for RPC, AI commentary, email, and analytics.
- Set vendor cost and outage alerts.
- Keep chess legality, tally, and settlement independent of an LLM provider.

Architecture decision records should identify exit cost and fallback for each critical vendor. Avoid building a Twitch-specific product until creator research proves Twitch is the dominant workflow.

## 33. Partnerships Strategy

Partnerships should close a specific gap rather than add logos.

Priority partnership types:

| Partner | Value received | Value offered |
|---|---|---|
| Creator networks/agencies | Creator supply | New interactive format and revenue |
| Chess communities/coaches | Credibility and scenarios | Exposure and educational events |
| Web3 protocols | Sponsor funding and distribution | Measurable community activation |
| Streaming tool vendors | Workflow integration | New use case and users |
| Wallet/onboarding providers | Lower conversion friction | Transaction volume and showcase |
| Legal/security specialists | Launch assurance | Paid engagement and case study |

For every partnership define owner, target outcome, integration cost, exclusivity, data sharing, commercial terms, and exit condition. Do not prioritize chain grants that force product choices unsupported by users.

## 34. Portfolio And Expansion Logic

Chess can be the initial content format without defining the eventual company boundary.

Possible strategic paths:

```text
A. Best creator-led crowd chess product
B. Interactive tournament operating system
C. Audience decision engine for live strategy games
D. White-label sponsored community event platform
```

Stay chess-focused until:

- Creator repeatability is demonstrated.
- The team knows which value comes specifically from chess and which comes from audience interaction.
- At least 20 completed events produce comparable format data.
- Expansion demand appears in interviews or paid requests.

Expansion test:

- Reuse the event, identity, voting, sponsor, and analytics layers for one non-chess pilot.
- Do not generalize the codebase before a paid or strategically strong request exists.
- Compare activation, completion, operating cost, and creator repeat intent against chess.

Potential exit or strategic value comes from retained creator distribution, sponsor relationships, trusted event infrastructure, and interaction data, not merely the smart contract or chess UI.

## 35. Scenario Planning And Capital Discipline

Plan for three operating scenarios:

| Scenario | Signal | Response |
|---|---|---|
| Engagement works, payments blocked | Users and creators return but legal/payment friction remains | Focus on B2B SaaS and sponsored free-entry events |
| Creators engage, users do not retain | Hosts like novelty but audiences act once | Shorten formats, improve team identity, test other games |
| Users retain, creators will not pay | Strong community play but weak B2B demand | Test sponsor-funded seasons or consumer subscription carefully |
| Sponsors buy, operations are expensive | Revenue exists but concierge work dominates | Productize templates and automation before scaling sales |
| Real-money mode approved | Legal path exists and pilots are healthy | Launch capped jurisdiction-specific trial, not global rollout |

Capital allocation order:

1. User research and concierge events.
2. Reliability, analytics, integrity, and creator workflow.
3. Repeatable distribution and paid pilots.
4. Retention features proven by experiments.
5. Automation for demonstrated operational bottlenecks.
6. Mainnet, marketplace, native token, or broad game expansion last.

Maintain a monthly kill list of features that are not connected to a current hypothesis, paid request, reliability need, or compliance gate.

## 36. Additional Decision Register

| Decision | Evidence required | Recommended default |
|---|---|---|
| Core voting format | Format tests and completion data | Candidate/strategy vote for short scenarios |
| Target match duration | Audience retention curve | 15-25 minutes for pilots |
| Direct competitor | Creator interviews | Current polls/bots/events, not another Web3 chess app |
| Native token | Repeat usage plus legal and economic case | Do not launch |
| Reward currency | User comprehension and legal/accounting review | Points or fixed sponsored prize |
| Creator event supply | Fill and repeat data | Curated scheduled cohort |
| Sponsor unit | Paid pilot feedback | Event/season package, not impressions alone |
| User identity | Conversion, recovery, and fraud tests | Progressive account with optional wallets |
| Product category | Twenty-event evidence | Remain chess-first until expansion demand exists |
| Marketplace launch | Supply density and integrity controls | Invite-only until healthy |

## 37. Additional Immediate Actions

- [ ] Run three game-format prototypes before committing to piece-type voting as the permanent mechanic.
- [ ] Set a 15-25 minute pilot match target and measure retention by minute.
- [ ] Build the competitive-alternative matrix from creator interviews.
- [ ] Produce a bottom-up market model using cited creator counts and pilot pricing.
- [ ] Write the defensibility thesis and update it after every ten completed events.
- [ ] Define a managed weekly event slate instead of launching an empty lobby.
- [ ] Create a sponsor one-pager, inventory list, measurement methodology, and make-good policy.
- [ ] Formally decide not to issue a native token during validation.
- [ ] Create an event ledger and reconciliation template before accepting paid sponsor or player funds.
- [ ] Publish support, result dispute, and escalation procedures before valuable-prize events.
- [ ] Audit asset, dependency, creator, sponsor, and AI-provider licenses.
- [ ] Review Twitch, YouTube, Discord, X, wallet, and hosting provider policies.
- [ ] Add community safety, reduced-motion, screen-reader, and bilingual requirements to acceptance criteria.
- [ ] Use progressive identity rather than treating one wallet as one permanent person.
- [ ] Review the roadmap monthly and remove work not tied to validation, revenue, trust, or reliability.
