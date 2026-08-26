# Architecture

GTrade is a trading backtesting platform built with Next.js 16, TypeScript, Tailwind v4, and Supabase.

## Clean Architecture

The codebase is organized into layers with a strict dependency rule: inner layers must not depend on outer layers, and **no business logic lives in the UI or route layer**.

### `src/app` (Routes, No Business Logic)
- Next.js App Router routes (`app/` directory).
- Route handlers and pages only orchestrate: they load data, call the engine, and render components.
- They must not contain backtesting math, indicator logic, or trading decisions.
- Where possible, pages are **React Server Components (RSC)** to keep server-side work off the client. Interactive widgets are the only client components.

### `src/lib/backtesting` (Framework-Free Deterministic Engine)
- The core backtesting engine. **Zero dependencies on React, Next.js, or Supabase.**
- It is a pure TypeScript module that can be unit-tested in isolation and run in the browser, on the server, or in a worker.
- Deterministic: given the same inputs it always produces the same outputs.
- This is where the candle loop, strategy execution, order simulation, and metrics live.

### `src/lib/indicators`
- Reusable technical indicator implementations (SMA, EMA, RSI, MACD, etc.).
- Pure functions: `(series, params) => result`. No framework dependencies.
- Used by strategies via the engine, never called directly from UI.

### `src/lib/calculations`
- Mathematical and statistical helpers (returns, drawdown, rolling stats).
- Pure, framework-free utilities shared by the engine and metrics.

### `src/components` (UI Only)
- Presentational React components. They render data and emit user intents.
- They must not compute backtest results or hold trading logic.
- Client components are kept minimal; server components do the heavy lifting.

### `supabase/migrations`
- SQL migration files defining the database schema, RLS policies, and seed data.
- All schema changes are versioned here, applied via the Supabase CLI.

## Hard Rule: NO Look-Ahead Bias

The engine must never allow a strategy to see future data. At any candle `t`, the strategy only has access to data at `t` and earlier. Signals, indicators, and metrics are computed strictly in chronological order. Violations of this rule are treated as correctness bugs, not features.
