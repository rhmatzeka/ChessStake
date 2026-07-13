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
