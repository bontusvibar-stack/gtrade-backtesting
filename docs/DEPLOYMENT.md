# GTrade Deployment & Setup

## Stack
Next.js 16.3 + React 19 + TypeScript + Tailwind + Supabase + lightweight-charts + recharts + framer-motion

## Env
Copy `.env.example` -> `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # server only, never expose to client
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
`.env.local` is gitignored (`*.env*`). Client only uses `NEXT_PUBLIC_` keys (`src/lib/supabase/client.ts` + `server.ts`).

## Local dev
```
npm install
npm run typecheck
npm run test        # vitest 51 tests
npm run dev         # http://localhost:3000
npm run build       # production build (19 routes)
```

## Supabase
1. Create project
2. Run migrations: `supabase/migrations/001_init.sql` (tables) then `002_rls.sql` (RLS)
3. Auth email/password enabled by default
4. Tables RLS: all `user_id = auth.uid()` (see `002_rls.sql`). Never trust client user_id.

## Security
- 0 vulnerabilities `npm audit`
- Service role key never imported in `src/` (checked)
- RLS on 13 tables + `handle_new_user()` trigger
- No secrets in repo

## Performance
- Web Worker `src/workers/backtest.worker.ts` auto for >=5k candles (`worker-client.ts`)
- Build: 19 routes, static + dynamic, Turbopack compile 6.3s + TS 58s
- Equity sampling: caps at 2000 points on save (`persistence.ts`)

## Known Limitations
- Swap/funding, dynamic spread, bid/ask, partial fills not modeled
- News filter requires dataset (warns `News data unavailable`)
- Session mapping approximated (Asia 07-15 WIB etc)
- Strategy Builder visual not yet compiles to live engine
- Monte Carlo resample only, not equity-path simulation
- No native PDF export (HTML report via `?format=report`)
