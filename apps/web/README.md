# ChessStake (PawnPool) Web App

The Next.js app for ChessStake. In the main deployment, **everything runs on one Vercel project**: the website, the game API, the AI move picker, and the database client.

## Run it locally

```bash
pnpm install --no-frozen-lockfile --ignore-scripts
pnpm --filter web prisma:generate
pnpm --filter web dev
```

The app runs at http://localhost:3000.

## Environment variables

The minimum for the demo:

```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_MOCK_CHAIN=true
NEXT_PUBLIC_ENABLE_ONCHAIN_BETS=false
```

If you don't have a database, create a free one on [Neon](https://neon.tech).

`NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` are **not** needed in this mode, because the page polls the API on the same domain.

## Deploy to Vercel

Set the **Root Directory** to `apps/web` (or let Vercel detect the `web` workspace), then use:

- Install: `pnpm install --no-frozen-lockfile --ignore-scripts`
- Build: `pnpm --filter web build`

The build runs `prisma db push`, so the demo tables are created in your `DATABASE_URL` database automatically.

## API routes

| Route | What it does |
| --- | --- |
| `GET /api/games/active` | The game that is currently running |
| `GET /api/games/:gameId/state` | Board, timer, and votes for a game |
| `POST /api/games/:gameId/votes/mock-bet` | Place a demo bet |
| `POST /api/games/:gameId/resolve-expired-turn` | Close the turn and let the AI move |
| `GET/POST /api/games/:gameId/settlement?address=0x...` | See or claim rewards and refunds for a wallet |
| `GET/POST /api/games/:gameId/spectators` | Who is watching a game |
| `GET /api/matches`, `POST /api/matches/create` | List matches or start a new one |
| `GET/POST /api/agents` | List or create AI betting agents |
| `POST /api/agents/:agentId/recommend` | Ask an agent which piece to vote for |
| `POST /api/agents/:agentId/auto-vote` | Let an agent vote for you |
| `GET /api/leaderboard`, `GET /api/agent-leaderboard` | Top players and top agents |
| `POST /api/analytics` | Record usage events |

Claims on the `/claim` page only mark records as claimed or refunded in the database. They don't send real ETH.
