# PawnPool Boss Battle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the piece-type betting demo with the free-to-play Boss Battle game (crowd picks 1 of 3 moves vs an AI Boss, points by move quality, sponsor-prize events) and ship it to production on Vercel.

**Architecture:** Single Next.js app (`apps/web`) on Vercel. Pure, unit-tested game logic in `apps/web/src/game/` (engine wrapper, candidates, scoring, state rules). DB access in `apps/web/src/server/` (Prisma + Neon), with atomic conditional updates for turn resolution and lazy progression on reads. CDN-cached public state endpoint + small per-user endpoint, polled by the client.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind 4, Prisma 5 + PostgreSQL (Neon), chess.js 1.x, Stockfish WASM (lite single-threaded) with chess.js alpha-beta fallback, viem (SIWE verify), wagmi + ConnectKit (sign-in only), zod, Vitest, GitHub Actions, Vercel.

**Spec:** `docs/superpowers/specs/2026-11-03-boss-battle-design.md`

## Global Constraints

- Node 22.x everywhere (`engines`, `.nvmrc`, Vercel project). pnpm 9.
- No betting vocabulary in UI copy: never "bet", "wager", "stake", "odds", "payout".
- Turn: 15 s picking window; next turn `opensAt` = resolve time + 2 s; `endsAt` = `opensAt` + 15 s.
- Points per turn: `10 + round(100 × max(0, 1 − cpLoss / 300))`; mate evals clamped to ±1000 cp.
- Event bonus (≥ 5 turns picked): WIN +500, SURVIVED +200, LOST +0. Prize eligibility: ≥ 10 turns picked, not disqualified.
- Quality labels by cp loss vs best: `best` < 30, `okay` 30–149, `blunder` ≥ 150.
- Default `maxCrowdMoves` 30. 5 consecutive resolved zero-pick turns → `ABANDONED`. Zero-pick turn plays the `okay` candidate (or the middle-quality one if no `okay`).
- Practice Arena: Boss Level 2, restarts 30 s after it ends, never has prizes.
- Sessions: signed httpOnly cookie, `SameSite=Lax`, 7 days; every POST checks `Origin`.
- Env vars: `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`, `ADMIN_ADDRESSES`, `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, `CRON_SECRET`. No other secrets.
- API errors: `{ ok: false, error: { code, message } }` with stable codes; never Prisma/stack text.
- Landing: Lighthouse mobile performance ≥ 90, client JS ≲ 150 KB gz, no wallet libraries.
- Commits as the user's git identity, no `Co-Authored-By` or AI attribution lines.
- README/profile-facing text: plain first-person sentences, no "·" separators.

## Review Focus

- A pick sent just before `endsAt` arrives just after it (or for a turn that already rolled over): server time decides, the pick carries `turnNumber`, and a stale turn gets `TURN_CLOSED` with a clear UI message rather than counting for the next turn. → Task 6 test `rejects pick for a turn that already rolled over`.
- Many viewers read state at the same instant after `endsAt`: exactly one resolve, one Boss move, one new turn, one practice restart. → Task 6 tests `concurrent resolve produces one move` and `concurrent practice restart creates one event`.
- Promotion moves (5-char UCI like `e7e8q`) appear as candidates, picks, labels and SAN without breaking. → Task 3 test `labels and keeps promotion candidates`.
- The game ends on the crowd's move (Boss is mated or stalemated: no Boss reply) and on the Boss's move (crowd mated). → Task 5 tests `crowd mate ends event as WIN without boss reply` and `boss mate ends event as LOST`.
- Client countdown on a skewed device clock: snapshot includes `serverNow`, client derives remaining time from it. → Task 10 test `countdown uses serverNow offset`.

---

## File Structure

```
apps/web/
  prisma/schema.prisma            (rewritten)  prisma/migrations/…  prisma/seed.ts
  vitest.config.ts
  src/game/                       pure logic, no DB/Next imports
    types.ts                      Candidate, Quality, EventStatus, EventResult, PublicState types
    engine.ts                     analyse(), bossMove() — Stockfish WASM with fallback
    engine-fallback.ts            alpha-beta on chess.js
    labels.ts                     labelMove()
    candidates.ts                 selectCandidates(), qualityOf()
    scoring.ts                    pickPoints(), eventBonus(), isPrizeEligible()
    rules.ts                      choosePlayedMove(), applyCrowdAndBoss(), nextStatusAfterTurn()
    __tests__/*.test.ts
  src/server/
    prisma.ts  errors.ts  http.ts (json helpers, origin check, rate limit)
    session.ts  auth.ts            SIWE nonce/verify, cookie session
    events.ts                      getPublicState(), progressEvent(), resolveTurn(), submitPick(), getMyState()
    leaderboard.ts  leads.ts  admin.ts
    __tests__/*.int.test.ts        need TEST_DATABASE_URL
  src/app/
    page.tsx  events/page.tsx  events/[slug]/page.tsx  overlay/[slug]/page.tsx
    leaderboard/page.tsx  rules/page.tsx  sponsor/page.tsx  host/page.tsx  admin/page.tsx
    api/auth/{nonce,verify,logout,me}/route.ts
    api/events/route.ts  api/events/[slug]/{state,me,picks}/route.ts
    api/leaderboard/route.ts  api/leads/route.ts  api/admin/…/route.ts  api/cron/route.ts
  src/components/
    site/ (Header, Footer)  arena/ (Board, CandidateArrows, CandidateCards, Timer, LiveTop, MoveLog, ResultCard, SponsorBanner)
    auth/ (SignInProvider — lazy wagmi/ConnectKit, SignInButton)
  src/hooks/ useEventState.ts  useMyState.ts
scripts/smoke.mjs
.github/workflows/ci.yml
```

---

### Task 1: Clean slate and toolchain

Remove everything the spec drops and get a green lint/typecheck/test/build on an almost empty app.

**Files:**
- Delete: `apps/api/`, `packages/contracts/`, `apps/web/public/assets/framecatur/`, `apps/web/public/{file,globe,next,vercel,window}.svg`, all of `apps/web/src/app/{agents,claim,host,how-to-play,leaderboard,matches,arena}`, `apps/web/src/app/api/*`, `apps/web/src/components/*` except `arena/ChessPieceSprite.tsx`, `apps/web/src/{hooks,stores,config,server,types,lib}`, `apps/web/vercel.json`, `scripts/vercel-smoke.mjs`
- Move: `PLAN.md`, `planlanjutan.md` → `docs/archive/`
- Modify: root `package.json` (engines node `22.x`), `.nvmrc` (`22`), `apps/web/package.json` (engines; scripts `test`, `test:int`; deps: drop socket.io-client, framer-motion, zustand, @tanstack/react-query stays only if ConnectKit needs it; add `zod`, `vitest`), `turbo.json` (globalEnv = spec env vars), `.env.example`, `vercel.json`, `pnpm-workspace.yaml` (drop the placeholder `allowBuilds` block), `packages/shared` → delete (constants move to `src/game`) and remove `shared` dep
- Create: `apps/web/vitest.config.ts`, `.github/workflows/ci.yml`, temporary `apps/web/src/app/page.tsx` stub

- [ ] **Step 1:** Delete/move the files above. Keep `public/assets/chess/*`.
- [ ] **Step 2:** `vercel.json` at root: `{"installCommand":"pnpm install --frozen-lockfile","buildCommand":"pnpm --filter web build","outputDirectory":"apps/web/.next","framework":"nextjs"}`. Web `build` script: `prisma generate && prisma migrate deploy && next build` (migrate only when `DATABASE_URL` set — wrap in `scripts/migrate-if-db.mjs`).
- [ ] **Step 3:** CI workflow: on PR + push to main, Node 22, pnpm 9, `pnpm install --frozen-lockfile`, `pnpm --filter web lint`, `typecheck`, `test`, `build` (with dummy env, migrate skipped), plus `test:int` job with a `postgres:16` service and `TEST_DATABASE_URL`.
- [ ] **Step 4:** Run `pnpm install && pnpm --filter web lint && pnpm --filter web typecheck && pnpm --filter web build`. Expected: all pass.
- [ ] **Step 5:** Commit `chore: drop betting demo, api server and contracts; Node 22 toolchain`.

### Task 2: Engine wrapper (spike first)

**Files:** Create `src/game/types.ts`, `src/game/engine.ts`, `src/game/engine-fallback.ts`, `src/game/__tests__/engine.test.ts`, `src/app/api/engine-check/route.ts` (temporary), `next.config.ts` (`outputFileTracingIncludes` for the WASM files)

**Interfaces — Produces:**
- `type EngineLine = { uci: string; cp: number }` (cp from side-to-move's view, mate clamped to ±1000)
- `analyse(fen: string, opts: { lines: number; budgetMs: number }): Promise<EngineLine[]>` sorted best first, every legal move up to `lines`
- `bossMove(fen: string, level: 1|2|3|4|5): Promise<string>` UCI
- `BOSS_LEVELS: Record<1|2|3|4|5, { skill: number; depth: number }>` (builder tunes; level 1 must lose to a casual crowd)

- [ ] **Step 1: Failing tests:** `finds mate in one` (FEN `6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1` → `analyse(...)[0].uci === 'd1d8'` and `cp === 1000`); `returns at most N lines, all legal`; `bossMove returns a legal move for every level`; `fallback engine finds mate in one` (same FEN through `engine-fallback`).
- [ ] **Step 2:** Run `pnpm --filter web test engine` → FAIL.
- [ ] **Step 3:** Implement with the `stockfish` npm package's lite single-threaded build loaded once per process (UCI over the worker/postMessage interface, `setoption MultiPV`, `go movetime`). Copy only the lite-single `.js`/`.wasm` into the function bundle. If load fails or exceeds budget, use `engine-fallback` (alpha-beta, material + piece-square tables, depth 3).
- [ ] **Step 4:** Tests pass locally.
- [ ] **Step 5: Spike on Vercel.** Temporary route `GET /api/engine-check` runs `analyse(startFen,{lines:8,budgetMs:900})` + `bossMove(…,3)` and returns timings. Deploy a preview (`vercel deploy`), call it 5 times. Pass = p95 total < 2000 ms and Stockfish (not fallback) used. Record result in the commit message; if it fails, make the fallback the default and note it.
- [ ] **Step 6:** Delete the temporary route. Commit `feat(game): engine wrapper with Stockfish WASM and fallback`.

### Task 3: Labels and candidates

**Files:** Create `src/game/labels.ts`, `src/game/candidates.ts`, tests `labels.test.ts`, `candidates.test.ts`

**Interfaces — Produces:**
- `type Quality = 'best' | 'okay' | 'blunder'`
- `type Candidate = { uci: string; san: string; label: string; evalCp: number; cpLoss: number; quality: Quality }`
- `labelMove(fen: string, uci: string): string`
- `qualityOf(cpLoss: number): Quality`
- `selectCandidates(fen: string, lines: EngineLine[], seed: string): Candidate[]` (≤ 3, shuffled deterministically by `seed`)

- [ ] **Step 1: Failing tests:**
  - `qualityOf`: 0→best, 29→best, 30→okay, 149→okay, 150→blunder.
  - `labelMove`: capture → `"Take the knight"` style (`Take the <captured>`), check → `"Check the king"`, castling → `"Castle to safety"`, promotion → `"Promote to a queen"`, knight/bishop off back rank → `"Develop the knight"`, center pawn push (c–f files) → `"Push the center pawn"`; precedence mate > capture > promotion > check > castle > develop > pawn push > fallback `"Move the <piece>"` (`"Deliver checkmate"` for mate).
  - `selectCandidates`: includes the best line; picks an okay with 40–149 cp loss when one exists; picks a trap with ≥150 cp loss preferring captures/checks; labels match `qualityOf(cpLoss)`; positions with 1 or 2 legal moves return 1 or 2; same seed → same order; `labels and keeps promotion candidates` (FEN `8/4P1k1/8/8/8/8/8/4K3 w - - 0 1` includes `e7e8q` with SAN `e8=Q`).
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat(game): move labels and 3-candidate selection`.

### Task 4: Scoring

**Files:** Create `src/game/scoring.ts`, test `scoring.test.ts`

**Interfaces — Produces:** `pickPoints(cpLoss: number): number`, `eventBonus(result: EventResult, turnsPicked: number): number`, `isPrizeEligible(turnsPicked: number, disqualified: boolean): boolean`; `type EventResult = 'WIN' | 'SURVIVED' | 'LOST'`

- [ ] **Step 1: Failing tests:** `pickPoints(0)=110`, `pickPoints(150)=60`, `pickPoints(300)=10`, `pickPoints(5000)=10`; `eventBonus('WIN',5)=500`, `('SURVIVED',5)=200`, `('LOST',9)=0`, `('WIN',4)=0`; `isPrizeEligible(10,false)=true`, `(9,false)=false`, `(20,true)=false`.
- [ ] **Steps 2–4:** fail → implement → pass. **Step 5:** Commit `feat(game): scoring rules`.

### Task 5: Turn and event rules (pure)

**Files:** Create `src/game/rules.ts`, test `rules.test.ts`

**Interfaces — Produces:**
- `type PickTally = { uci: string; count: number; firstAt: number }[]`
- `choosePlayedMove(candidates: Candidate[], tally: PickTally): { uci: string; zeroPick: boolean }` — most picks; tie → earliest `firstAt`; zero picks → `okay`, else middle cp loss
- `applyCrowdAndBoss(fen: string, crowdUci: string, bossUci: string | null): { fenAfterCrowd: string; crowdSan: string; fenAfter: string; bossSan: string | null; ended: null | { result: EventResult } }`
- `crowdGameOver(fen: string): null | EventResult` (Boss to move: mated → WIN, stalemate/draw → SURVIVED)
- `nextStatusAfterTurn(input: { ended: EventResult | null; crowdMoveNumber: number; maxCrowdMoves: number; emptyStreak: number }): { status: 'LIVE' | 'FINISHED' | 'ABANDONED'; result: EventResult | null }`

- [ ] **Step 1: Failing tests:** `most picks wins`; `tie goes to earliest firstAt`; `zero picks plays okay candidate`; `crowd mate ends event as WIN without boss reply` (crowd plays mate, `crowdGameOver` returns WIN, no boss move applied); `boss mate ends event as LOST`; `draw by rule is SURVIVED`; `reaching maxCrowdMoves is SURVIVED`; `5 empty turns is ABANDONED`, `4 is LIVE`.
- [ ] **Steps 2–4:** fail → implement → pass. **Step 5:** Commit `feat(game): turn and event rules`.

### Task 6: Database schema and event service

**Files:** Rewrite `prisma/schema.prisma` (models from spec §6.1: `User`, `AuthNonce`, `Event`, `Turn`, `Pick`, `EventScore`, `Lead`; `directUrl = env("DIRECT_URL")`), create first migration `prisma/migrations/<ts>_boss_battle/`, `prisma/seed.ts` (upserts the practice event, slug `practice`), `src/server/prisma.ts`, `src/server/errors.ts`, `src/server/events.ts`, tests `src/server/__tests__/events.int.test.ts` + `test/db.ts` (resets schema on `TEST_DATABASE_URL`)

**Interfaces — Consumes:** Tasks 2–5. **Produces:**
- `class AppError extends Error { code: string; status: number }`
- `getPublicState(slug: string): Promise<PublicState>` — runs `progressEvent` first. `PublicState = { slug, title, hostName, sponsor: {name, logoUrl, url, prizeText} | null, bossLevel, status, result, isPractice, fen, lastMove: {uci, san, by: 'crowd'|'boss'} | null, turn: { number, opensAt, endsAt, candidates: Omit<Candidate,'quality'|'cpLoss'|'evalCp'>[], tally: {uci,count}[] } | null, history: { number, crowdSan, bossSan, candidates: Candidate[] }[], top: {name, points}[] /* 10 */, playersOnline: number, startsAt, serverNow }`
- `progressEvent(eventId: string): Promise<void>` — lazy start, resolve expired turn, practice restart; each via conditional `updateMany` and checks `count === 1`
- `resolveTurn(eventId: string, turnNumber: number): Promise<boolean>` — claims the turn (`OPEN`→`RESOLVING` where `number` matches), computes, writes Boss reply + next turn with precomputed candidates (`seed = eventId:number`), scores picks into `Pick.points` and `EventScore`, applies end bonus; returns `false` if another request won the claim
- `submitPick(slug: string, userId: string, turnNumber: number, uci: string): Promise<void>` — errors `EVENT_NOT_LIVE`, `TURN_CLOSED`, `TURN_NOT_OPEN_YET`, `NOT_A_CANDIDATE`
- `getMyState(slug: string, userId: string): Promise<{ pickUci: string | null; points: number; turnsPicked: number; rank: number | null }>`
- `playersOnline` = distinct users with a pick in the last 3 turns + anonymous heartbeat is dropped (YAGNI)

- [ ] **Step 1:** Start test DB: `docker run -d --name pp-test -e POSTGRES_PASSWORD=pp -p 5544:5432 postgres:16`; `TEST_DATABASE_URL=postgresql://postgres:pp@localhost:5544/postgres`.
- [ ] **Step 2: Failing integration tests:** `scheduled event goes LIVE on first read after startsAt`; `pick then resolve plays most-picked move and Boss replies`; `last pick in a turn counts`; `rejects pick for a turn that already rolled over` (TURN_CLOSED); `rejects pick before opensAt`; `concurrent resolve produces one move` (`Promise.all` of 10 `getPublicState` after `endsAt` → exactly one `Turn` with number 2, one Boss move); `concurrent practice restart creates one event`; `points and end bonus land in EventScore`; `disqualified score excluded` (via Task 9 query, assert here on `EventScore.disqualified`).
- [ ] **Step 3:** Run `pnpm --filter web test:int` → FAIL. **Step 4:** Implement. **Step 5:** → PASS.
- [ ] **Step 6:** Commit `feat(server): boss battle schema and event service`.

### Task 7: Auth (SIWE) and HTTP helpers

**Files:** Create `src/server/session.ts`, `src/server/auth.ts`, `src/server/http.ts`, routes `src/app/api/auth/{nonce,verify,logout,me}/route.ts`, tests `auth.int.test.ts`, `http.test.ts`

**Interfaces — Produces:**
- `createNonce(): Promise<string>`; `verifySignIn(message: string, signature: Hex): Promise<User>` (checks domain = request host, nonce unused + unexpired, marks used, upserts lowercase address)
- `getSession(): Promise<{ userId: string; address: string } | null>`; `setSession(user)`, `clearSession()` — cookie `pp_session`, HMAC-SHA256 with `SESSION_SECRET`, 7 days
- `requireUser(): Promise<{userId, address}>` (throws `AppError('UNAUTHENTICATED',401)`)
- `assertSameOrigin(req: Request): void` (`AppError('BAD_ORIGIN',403)`)
- `rateLimit(key: string, max: number, windowMs: number): void` (per-instance memory, `AppError('RATE_LIMITED',429)`)
- `ok(data, init?)`, `fail(err)` → JSON helpers; `fail` maps unknown errors to `INTERNAL_ERROR` with generic message and logs the real one
- `PATCH /api/auth/me` sets `displayName` (2–20 chars, `[A-Za-z0-9_ .-]`)

- [ ] **Step 1: Failing tests:** valid signature (viem `privateKeyToAccount` test key) signs in; reused nonce → `NONCE_USED`; expired nonce → `NONCE_EXPIRED`; wrong domain → `BAD_DOMAIN`; tampered cookie → no session; `assertSameOrigin` rejects foreign origin, accepts own; `fail` hides Prisma error text.
- [ ] **Steps 2–4:** fail → implement → pass. **Step 5:** Commit `feat(auth): wallet sign-in with signed session cookie`.

### Task 8: Game API routes

**Files:** Create `src/app/api/events/route.ts` (GET lobby: live, upcoming, past 20), `src/app/api/events/[slug]/state/route.ts`, `…/me/route.ts`, `…/picks/route.ts`, `src/app/api/cron/route.ts`; tests `routes.int.test.ts`

- [ ] **Step 1: Failing tests:** state returns 200 with `Cache-Control: public, s-maxage=1, stale-while-revalidate=1` and no per-user fields; unknown slug → 404 `EVENT_NOT_FOUND`; picks without session → 401; picks with bad body → 400 `VALIDATION_ERROR` (zod: `{ turnNumber: int ≥1, uci: /^[a-h][1-8][a-h][1-8][qrbn]?$/ }`); picks rate-limited at 10 per 10 s per user; cron without `Authorization: Bearer $CRON_SECRET` → 401, with it → progresses all LIVE/SCHEDULED events.
- [ ] **Steps 2–4:** fail → implement → pass. Add `crons` entry in `vercel.json` (`0 3 * * *`, Hobby-compatible).
- [ ] **Step 5:** Commit `feat(api): event state, picks and cron routes`.

### Task 9: Leaderboard, leads and admin

**Files:** Create `src/server/leaderboard.ts`, `src/server/leads.ts`, `src/server/admin.ts`, routes `api/leaderboard`, `api/leads`, `api/admin/events` (GET/POST), `api/admin/events/[id]` (PATCH: edit/cancel), `api/admin/events/[id]/scores` (GET CSV, PATCH disqualify/markPaid), `api/admin/leads` (GET, PATCH handled); tests `leaderboard.int.test.ts`, `admin.int.test.ts`

**Interfaces — Produces:** `seasonLeaderboard(month: string /* YYYY-MM, UTC+7 */): Promise<{ rank, name, points }[]>` (top 50, excludes disqualified rows); `eventLeaderboard(eventId): Promise<{ rank, name, address, points, turnsPicked, eligible, prizePaidAt }[]>`; `createLead(input: { type: 'SPONSOR'|'CREATOR'; name; contact; organization?; message })` (zod lengths: name ≤ 80, contact ≤ 120, message ≤ 1000; honeypot field `website` must be empty); `requireAdmin()` (session address in `ADMIN_ADDRESSES`, else 403 `NOT_ADMIN`); `createEvent(input: { title; slug; hostName; startsAt; bossLevel; maxCrowdMoves?; sponsorName?; sponsorLogoUrl?; sponsorUrl?; prizeText? })`.

- [ ] **Step 1: Failing tests:** season sums points + bonus across the month and excludes disqualified; month boundary uses WIB; CSV has header `rank,name,address,points,turnsPicked,eligible` and only eligible rows marked `true`; non-admin gets 403; lead with honeypot filled is silently accepted but not stored; lead rate-limited 3 per hour per IP.
- [ ] **Steps 2–4:** fail → implement → pass. **Step 5:** Commit `feat: leaderboards, leads and admin API`.

### Task 10: Site shell, landing and static pages

Use the frontend-design skill. Palette and pixel sprites from the current app (`#070605` bg, `#ede6dc` text, `#e6a855` gold, `#26211e` lines). Server components only.

**Files:** `src/app/layout.tsx` (fonts, metadata, OG image), `src/components/site/{Header,Footer}.tsx`, `src/app/page.tsx`, `src/app/rules/page.tsx`, `src/app/sponsor/page.tsx`, `src/app/host/page.tsx`, `src/components/site/LeadForm.tsx` (client, posts to `/api/leads`), `src/app/events/page.tsx`, `src/app/leaderboard/page.tsx`, `src/lib/time.ts` + test

- [ ] **Step 1: Failing test** `time.test.ts`: `countdown uses serverNow offset` — `remainingMs(endsAt, serverNow, clientNowAtFetch, clientNow)` returns `endsAt − serverNow − (clientNow − clientNowAtFetch)`, floored at 0.
- [ ] **Step 2:** Implement `src/lib/time.ts`; test passes.
- [ ] **Step 3:** Landing content (spec §4): hero "Your community vs the AI Boss" + "Free to play. Sponsors put up the prizes." + `Play now` → `/events/practice`; next event card with countdown (server-fetched, revalidate 30 s); 3 steps; For sponsors (packages from spec §5.2 in plain words, CTA `/sponsor`); For creators (CTA `/host`); footer. Rules page includes the points formula, quality thresholds, prize eligibility, short Terms and Privacy.
- [ ] **Step 4:** `pnpm --filter web build && pnpm --filter web start`; Lighthouse mobile on `/` (via `npx lighthouse http://localhost:3000 --preset=perf --form-factor=mobile --only-categories=performance`). Expected ≥ 90. Check `.next` build output: `/` First Load JS ≲ 150 KB.
- [ ] **Step 5:** Commit `feat(web): landing, lobby, leaderboard, rules, sponsor and host pages`.

### Task 11: Arena, sign-in and overlay

**Files:** `src/components/auth/{SignInProvider,SignInButton}.tsx` (wagmi + ConnectKit + SIWE flow, loaded with `next/dynamic` only here), `src/hooks/useEventState.ts` (poll `/state` every 1 s while visible, pause when hidden), `src/hooks/useMyState.ts` (poll `/me` every 3 s when signed in), `src/components/arena/*`, `src/app/events/[slug]/page.tsx`, `src/app/overlay/[slug]/page.tsx`

- [ ] **Step 1:** Board renders FEN with existing sprites; candidate arrows as SVG over the board (colors per card, highlight my pick); cards show label + SAN + live count; after resolve, the previous turn's cards show quality badge and eval for 2 s, then the Boss move animates.
- [ ] **Step 2:** Picking: tapping a card or arrow → `POST /picks`; optimistic highlight; on `TURN_CLOSED` show "Too late, this turn just ended"; not signed in → sign-in sheet.
- [ ] **Step 3:** Side panel: timer (Task 10 `remainingMs`), players online, my points/rank, top 10, sponsor banner + prize text, move log with qualities. Before start: countdown + "Add to calendar" (`.ics` data URL). After end: result card (WIN/SURVIVED/LOST/ABANDONED), my points, share button (Web Share API, copy-link fallback), link to next event.
- [ ] **Step 4:** Overlay page: board + cards + timer, transparent background, no header/footer.
- [ ] **Step 5: Manual verification** with `pnpm --filter web dev` + local Postgres: two browsers (two test wallets) play a full practice event; turn resolves once; points show; mobile width 375 px usable.
- [ ] **Step 6:** Commit `feat(web): arena, wallet sign-in and OBS overlay`.

### Task 12: Admin page

**Files:** `src/app/admin/page.tsx` + client components (events table with create/edit/cancel form, leads list with "mark handled", per-event scores with disqualify / mark paid / download CSV).

- [ ] **Step 1:** Implement against Task 9 APIs; non-admin sees "Not allowed".
- [ ] **Step 2: Manual verification:** with my wallet in `ADMIN_ADDRESSES`, create a scheduled event 2 minutes ahead, watch it go live from the lobby, export CSV after it ends.
- [ ] **Step 3:** Commit `feat(web): admin console`.

### Task 13: Deploy and docs

**Files:** `scripts/smoke.mjs`, `README.md`, `.env.example`, Vercel project settings

- [ ] **Step 1:** `scripts/smoke.mjs <baseUrl>`: GET `/`, `/events`, `/events/practice`, `/rules`, `/api/events/practice/state` (200, has `serverNow`, cache header), `/api/events` (200); call the state endpoint 20 times with a cache-busting query and report p95 (target < 300 ms). Exit 1 on any failure.
- [ ] **Step 2:** Vercel project: Node 22, env vars from Global Constraints (generate `SESSION_SECRET`, `CRON_SECRET`; `ADMIN_ADDRESSES` = owner wallet — ask the owner for the address), Git repo `rhmatzeka/pawnpool`. Check the existing Neon DB holds only PawnPool demo tables before migrating; otherwise create a new database.
- [ ] **Step 3:** Merge PR to `main` after CI green; production deploy; run `prisma/seed.ts` against prod; `node scripts/smoke.mjs https://pawnpool.rahmateka.my.id` → all OK; manual play-through on phone width.
- [ ] **Step 4:** README rewrite (pitch, how a Boss Battle works, points, business model in short prose, local setup with Docker Postgres, deploy) in the owner's style; `gh repo edit` description + topics.
- [ ] **Step 5:** Commit `docs: README for Boss Battle` (before merge), save AI log + memory update.
