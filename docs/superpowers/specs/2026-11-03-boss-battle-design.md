# PawnPool Boss Battle: design

Date: 2026-11-03
Status: draft, waiting for owner approval
Repo: rhmatzeka/pawnpool (renamed from ChessStake on 2026-11-03)

## 1. Why this rewrite

PawnPool today is a hackathon demo: viewers pay testnet ETH to vote on a piece *type*
(e.g. "Knight"), then a heuristic picks the actual move. The owner's verdict: the game is
unclear (you never really choose a move), the market and business model are unclear, there
are many bugs, code quality and performance are poor, and the Vercel deploy is broken
(project still on Node 20).

Betting real money on a game outcome counts as gambling under Indonesian law (KUHP 303),
and the owner is in Indonesia. So the new version drops betting completely. Players never
pay to play. Money comes from the people who want an engaged live audience: sponsors and
creators.

The goal is a product that is clear in one sentence, runs in production on Vercel, and can
earn its first money without an investor (running cost is close to zero on Vercel Hobby +
Neon free tier).

**One-line pitch:** "Your community plays chess together against an AI Boss. Free to play,
sponsors put up the prizes."

## 2. Goals, non-goals, anti-goals

Goals
- A game a non-chess player understands in 10 seconds.
- A business flow with a clear payer: sponsor events first, Creator Pro later, cosmetics last.
- Production quality: correct under concurrent users, typed, tested, CI, fast pages.
- Deployed on Vercel at https://pawnpool.rahmateka.my.id, working end to end.

Non-goals (this version)
- No real-money or testnet-ETH betting, no pools, no claims, no payouts in crypto.
- No smart contract work. No payment gateway (sponsor deals are invoiced manually at first).
- No Community-vs-Community mode yet (planned next, see §11).
- No player-owned auto-voting agents (they would farm the leaderboard; see §10).
- No native mobile app.

Anti-goals (would be a failure even if it technically works)
- Anything that reads as gambling: no "bet", "wager", "stake", "odds", "payout" in the UI.
- A lobby that looks dead. There must always be something live to play.
- Two people seeing different board states, or a turn resolving twice.
- A landing page that takes seconds to show anything on a phone.

## 3. The game: Boss Battle

### 3.1 Format
- An **event** is a scheduled match: "Friday 20:00 WIB: Komunitas X vs AI Boss Level 3".
- The **crowd** plays White. The **AI Boss** plays Black.
- Each crowd turn shows **3 candidate moves** as arrows on the board, each with a plain
  label ("Take the knight", "Castle to safety", "Push the center pawn").
- Players have **15 seconds** to pick one. One pick per wallet per turn, can change the pick
  until the timer ends (last pick counts).
- The candidate with the most picks is played. Ties: the earliest candidate to reach that
  count wins; if still tied (e.g. zero picks), see §3.4.
- The Boss replies immediately (a short 1 to 2 second "thinking" animation for feel).
- After each turn the quality of all 3 candidates is revealed (best / okay / blunder,
  with the engine eval) so the game teaches and feels fair.

### 3.2 Candidates (what makes it a skill game)
The 3 candidates are deliberately mixed so picking well is a skill:
1. **Best**: engine's top move.
2. **Okay**: a reasonable move, clearly worse than best (engine rank roughly 3 to 6).
3. **Trap**: a tempting but bad move (prefer captures or checks that lose material).
   If no tempting bad move exists, take a clearly weaker move.
Order is shuffled. The label for each comes from simple rules (capture, check, castle,
promotion, develops a piece, pushes a center pawn, retreats, defends an attacked piece),
not from an LLM, so it costs nothing and never hallucinates illegal moves.
If the position has fewer than 3 legal moves, show what exists.

### 3.3 Points (personal score, separate from what the crowd plays)
- Per turn, a player who picked gets `10` for showing up plus
  `round(100 × max(0, 1 − cpLoss / 300))`, where `cpLoss` is the centipawn difference
  between the best candidate and the one they picked (best = 110 total).
  Mate scores are clamped to ±1000 cp before the calculation.
- End-of-event bonus to every player who picked in at least 5 turns:
  crowd **wins** (Boss checkmated) +500, crowd **survives** (move limit reached or draw) +200,
  crowd **loses** +0.
- Points feed two leaderboards: **per event** (for that event's prizes) and **season**
  (calendar month, resets on the 1st, for season prizes and bragging rights).
- The formula is shown on the rules page.

### 3.4 Event lifecycle
- `SCHEDULED` → `LIVE` at `startsAt` → `FINISHED` (result WIN / SURVIVED / LOST) or
  `ABANDONED`.
- Move limit: `maxCrowdMoves` (default 30). Reaching it without being mated = SURVIVED.
  Any draw by chess rules = SURVIVED.
- A turn with zero picks plays the **Okay** candidate (game keeps flowing, nobody scores).
  5 zero-pick turns in a row → `ABANDONED`.
- Boss levels 1 to 5 map to engine strength (level 1 beatable by a casual crowd,
  level 5 very hard). The exact mapping is the builder's call, tuned by playtesting.

### 3.5 Always-on Practice Arena
- One permanent event ("Practice Arena", Boss Level 2) that restarts itself 30 seconds after
  it ends. It is always LIVE, so the lobby is never empty and a first-time visitor can play
  in one click.
- Practice points count for the season leaderboard but practice never has prizes.

### 3.6 Login
- Watching needs nothing.
- Picking needs a wallet sign-in: Sign-In with Ethereum style message signature (no gas, no
  chain transaction), verified server-side, giving an httpOnly session cookie.
- Players can set a display name (shown on leaderboards instead of the address).
- Why wallet and not email: the first sponsors are expected to be Web3 projects that value
  wallet addresses of engaged users (see §5).

## 4. Pages

| Route | Purpose |
| --- | --- |
| `/` | Landing. Hero with the pitch and a "Play now" button to the Practice Arena, the next event with countdown, how it works in 3 steps, "For sponsors" and "For creators" sections, footer with Rules/Terms/Privacy. |
| `/events` | Lobby: Live now, Upcoming (countdown), Past (result + top 3). |
| `/events/[slug]` | The arena: board with candidate arrows, 3 candidate cards, timer, live pick counts, players online, live top-10, sponsor banner and prize text, move history with revealed qualities, result screen with share button. Before `startsAt`: countdown and "remind me" (add to calendar link). |
| `/leaderboard` | Season leaderboard, with month switcher. |
| `/sponsor` | Sponsor packages, what the sponsor gets, contact form (stored as a lead). |
| `/host` | For creators: what Creator Pro will include, application/waitlist form (stored as a lead). |
| `/rules` | How to play, points formula, fairness (how candidates are chosen), prize rules, Terms and Privacy (short, plain). |
| `/overlay/[slug]` | Board + candidates + timer on a transparent background for OBS. Free during launch, later a Creator Pro feature. |
| `/admin` | Only wallets in `ADMIN_ADDRESSES`. Create/edit/cancel events, view leads, export an event leaderboard as CSV, mark prize winners as paid, disqualify a player from an event. |

The UI language is English (sponsors and Web3 communities are international). Indonesian can
come later.

## 5. Business model

### 5.1 Who pays and why
| Payer | Why they pay | What they get |
| --- | --- | --- |
| **Sponsor** (Web3 project, brand, community) | They already pay for engagement campaigns on quest platforms (Galxe, Zealy, Layer3 style). A live event where people actively play for 10 minutes is stronger engagement than a "follow us" task. | Logo on the arena and overlay, named event, prize announcement, post-event report (players, picks, top wallets, CSV). |
| **Creator** (chess streamer, Discord/Telegram community) | Interactive content for their stream, a reason for the audience to stay, a cut of sponsor deals they bring. | Later: Creator Pro. Now: hosted events on request + 30% of any sponsor fee they bring. |
| **Player** | Nothing required. Optional cosmetics later. | Free game, prizes, leaderboard status. |

### 5.2 Packages (starting prices, owner may change)
- **Sponsored Event**: from Rp3.000.000 (about US$190) per event. Example split:
  Rp1.500.000 prizes for the event top 10, Rp1.500.000 platform revenue.
  If a creator brought the sponsor, the creator gets 30% of the platform part.
- **Season Sponsor**: from Rp10.000.000 per month, logo on every event and the season
  leaderboard, season prize pool.
- **Creator Pro** (later, waitlist now): about Rp99.000 per month. Self-serve events, custom
  Boss name and level, private events, overlay, analytics.
- **Cosmetics** (later): board and piece skins, profile badges, Rp15.000 to Rp50.000.
  Never affects the game.

### 5.3 How the money moves (MVP)
- Sponsor fills the form on `/sponsor` → owner gets the lead in `/admin` → deal agreed by
  chat → owner sends a manual invoice (bank transfer or USDC) → owner creates the event in
  `/admin` with the sponsor's name, logo and prize text.
- After the event the owner exports the top-10 CSV, the sponsor or owner sends the prizes,
  the owner marks them paid in `/admin`. Prize eligibility: picked in at least 10 turns of
  that event and not disqualified.
- No payment gateway in this version. A gateway (Xendit/Midtrans/Stripe) comes with
  Creator Pro.

### 5.4 Go-to-market
1. Free events with 2 to 3 friendly communities to collect numbers (players per event,
   average turns played, return rate).
2. Use those numbers to pitch the first sponsor.
3. Weekly fixed slot ("PawnPool Friday Boss Battle") to build habit.
4. Open the Creator Pro waitlist once creators ask to host on their own.

North-star metric: **active players per event** (players who picked in ≥5 turns).

## 6. Architecture

Stays a pnpm + Turbo monorepo deployed on Vercel. Everything runs inside the Next.js app.

- **Remove** `apps/api` (legacy Express + Socket.IO), `packages/contracts` (betting pool
  contract, conflicts with the no-betting decision), the betting/claim/agent routes and pages,
  and the 5 MB scroll frame animation. History stays in git.
- **Move** `PLAN.md` and `planlanjutan.md` to `docs/archive/`.
- **Game logic** lives in a pure, framework-free module (`packages/game` or
  `apps/web/src/game`, builder's call): candidate selection, labels, scoring, turn resolution
  rules, event state machine. Fully unit tested. The database layer calls it.
- **Engine**: a real chess engine, not the current heuristic. Must run inside a Vercel Node
  function within about 2 seconds for candidate generation + Boss reply. Stockfish compiled to
  WASM (single-threaded build) is the expected choice; the builder may pick another engine if
  it meets the time budget and gives stable evals. No external engine API.
- **Turn resolution must be atomic.** Exactly one request resolves a turn, using a
  conditional update in the database (e.g. `UPDATE ... WHERE status='OPEN' AND number=n`
  and check the row count) or a transaction with row locking. No in-memory locks (they do
  nothing on serverless). Resolution precomputes and stores the next turn's 3 candidates and
  the Boss reply, so reads stay cheap.
- **Who triggers resolution**: any read of the event state after `endsAt` (lazy, as today) and
  a Vercel Cron as a safety net for events nobody is watching (Hobby cron limits apply; the
  lazy path must be enough on its own).
- **Live updates**: polling, but cheap. `GET /api/events/[slug]/state` returns a small public
  snapshot with `Cache-Control: public, s-maxage=1, stale-while-revalidate=1`, so the Vercel
  CDN answers most viewers and the function runs about once per second per event regardless of
  audience size. Per-user data (my pick, my points) comes from a separate small endpoint
  polled only while signed in. Polling pauses when the tab is hidden.
- **Picks**: `POST /api/events/[slug]/picks` with the session cookie; upsert on
  `(eventId, turnNumber, userId)`; rejected after `endsAt` (server time).
- **Database**: Neon Postgres via Prisma. Use `prisma migrate` with committed migrations,
  not `db push` during the build. The old demo tables and data are dropped (they are demo
  data only).
- **Auth**: SIWE-style message with a server nonce (stored, single use, expires in 10 minutes),
  signature verified with viem, session as a signed httpOnly cookie. Rate limit picks and
  sign-in per IP and per user (simple DB or in-memory-per-instance limiter is acceptable).
- **Frontend**: server components by default, client components only where needed (board,
  picks, wallet). Wallet libraries load only on pages that need sign-in, not on the landing
  page. Images via `next/image`. Keep the existing pixel chess sprites
  (`public/assets/chess`) and the dark brown/gold palette as the visual base; redesign within
  it (builder's call, use the frontend-design skill).
- **Node**: 22.x (`engines`, `.nvmrc`, Vercel project setting). pnpm 9.
- **Env vars**: `DATABASE_URL`, `DIRECT_URL` (Neon, for migrations), `SESSION_SECRET`,
  `ADMIN_ADDRESSES` (comma list), `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, `CRON_SECRET`.
  Remove all betting/chain/xAI env vars.

### 6.1 Data model (shape, builder may refine)
- `User` (id, address unique lowercase, displayName, createdAt)
- `AuthNonce` (nonce, expiresAt, usedAt)
- `Event` (id, slug unique, title, hostName, sponsorName?, sponsorLogoUrl?, sponsorUrl?,
  prizeText?, bossLevel, maxCrowdMoves, startsAt, status, result?, fen, crowdMoveNumber,
  emptyTurnStreak, isPractice, createdAt, finishedAt?)
- `Turn` (id, eventId, number, status OPEN/RESOLVED, opensAt, endsAt, fenBefore,
  candidates JSON [{uci, san, label, evalCp, quality}], chosenUci?, bossReplyUci?,
  bossReplySan?, fenAfter?, resolvedAt?) unique (eventId, number)
- `Pick` (id, eventId, turnNumber, userId, uci, points?, createdAt, updatedAt)
  unique (eventId, turnNumber, userId)
- `EventScore` (eventId, userId, turnsPlayed, points, bonus, disqualified, prizePaidAt?)
  unique (eventId, userId). Season leaderboard = sum over the month's events.
- `Lead` (id, type SPONSOR/CREATOR, name, contact, organization?, message, createdAt,
  handledAt?)

### 6.2 Timing and edge rules (designer's calls)
- **No background timer.** Everything advances lazily when someone reads state (works on
  Vercel Hobby, where cron runs only daily). The daily cron only cleans up stale events.
- **One resolve per read, no catch-up loop.** A turn that resolves late opens the next turn
  at resolve time, not at the old schedule. If nobody watched, the game simply waits.
- **Boss thinking delay** is real in the timeline: next turn `opensAt` = resolve time + 2 s,
  `endsAt` = `opensAt` + 15 s. The client shows the Boss move animation during those 2 s;
  picks are rejected before `opensAt`.
- **Abandonment** counts only consecutive turns that actually resolved with zero picks.
- **Practice Arena restart** is lazy too: a state read on a finished practice event older than
  30 s creates the next practice event (atomically, at most one).
- **Event start** is lazy: the first read after `startsAt` flips `SCHEDULED` to `LIVE` and opens
  turn 1.
- **Candidate quality thresholds** are cp-based on loss vs the best move: `best` < 30 cp,
  `okay` 30 to 149 cp, `blunder` ≥ 150 cp. Selection prefers an Okay candidate with
  40 to 149 cp loss and a Trap with ≥ 150 cp loss (tempting captures/checks first). If none
  exist in that band, take the next weakest move and label it by its real loss, so the
  revealed label is always true. Forced-mate positions still show up to 3 candidates.
- **Scoring uses the last pick** a player made in that turn. Bonus (≥ 5) and prize (≥ 10)
  thresholds count turns where the player had a pick when the turn resolved.
- **Disqualified** players lose that event's points from the season total.
- **Sessions**: signed httpOnly cookie, `SameSite=Lax`, 7-day lifetime; all POST routes check
  the `Origin` header against the site origin.
- **Sponsor logo** is a pasted URL (admin), rendered through `next/image` remote patterns.
- **Database**: reuse the Neon database already attached to the Vercel project after checking
  it only holds PawnPool demo tables; if anything else lives there, create a new database
  instead. Migrations start from a fresh baseline.
- **Engine risk**: the first implementation task is a spike that proves the engine runs in a
  Vercel Node function inside the time budget (multi-PV top 8 for candidates + Boss reply).
  If it fails, fall back to an alpha-beta search on chess.js with a fixed depth.

## 7. Quality bar

- TypeScript strict, no `any` in game logic or API code. ESLint clean.
- Unit tests (Vitest) for: candidate selection and labels, scoring formula, turn resolution
  (normal, tie, zero picks, mate, draw, move limit, abandonment), event state machine.
- Integration test for the resolve race: two concurrent resolves of the same turn produce
  exactly one move.
- All API input validated with zod; errors return stable codes and never leak stack traces or
  Prisma messages.
- GitHub Actions CI: install, lint, typecheck, test, build on every PR.
- Performance: landing page Lighthouse mobile performance ≥ 90; landing page client JS under
  about 150 KB gzipped; arena state endpoint p95 under 300 ms when served by the function.
- Smoke script that loads `/`, `/events`, the practice arena and the state endpoint against a
  deployed URL (replace the current `scripts/vercel-smoke.mjs`).

## 8. Deploy

- Fix the Vercel project: Node 22, root/build/install commands that match the new repo layout,
  env vars from §6, Git connection pointing at `rhmatzeka/pawnpool`.
- Run migrations against Neon, seed the Practice Arena event.
- Verify on the live domain with the smoke script and a manual play-through (sign in, pick,
  see the turn resolve, see points).
- Update README (new pitch, how it works, business model summary, setup, deploy) and the
  repo description/topics. README text follows the owner's style: plain first-person
  sentences, no "·" separators, no AI-looking bullet/table walls in profile-facing text.

## 9. Decided by the owner (2026-11-03)
- Switch from "vote on a piece type" to the Boss Battle format: crowd vs AI Boss, pick 1 of 3
  moves, personal points by move quality, scheduled events with sponsor prizes for the top 10.
- Free to play, no betting. Revenue from sponsors first, Creator Pro subscription next,
  cosmetics last. No investor needed to start.
- Repo renamed to `pawnpool`.
- Fix bugs, code quality and performance, then deploy to Vercel.

## 10. Calls made by the designer (owner can override)
- Prices in §5.2 are starting points, not decided.
- Drop player-owned auto-voting AI agents for now: bots picking for players would farm the
  leaderboard and prizes. The "AI" in the product is the Boss and the move labels.
- Drop the smart contract and testnet ETH entirely in this version.
- Practice Arena at Boss Level 2, restarting 30 s after it ends.
- Zero-pick turn plays the "Okay" candidate; 5 in a row abandons the event.
- Prize eligibility: ≥10 turns picked in that event.
- English UI first.
- Old demo data is dropped.
- Wallet sign-in only (no email/guest picking).

## 11. Later (not in this version)
- Community vs Community mode (two crowds, each picks for one color).
- Creator Pro self-serve with payment gateway.
- Cosmetics shop.
- Indonesian UI.
- Optional LLM commentary on moves.
- Sybil resistance beyond wallet sign-in (e.g. sponsor-defined allowlists, social login).
