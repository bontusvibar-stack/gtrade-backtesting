# AGENTS.md — GTrade

Instructions for coding agents working on GTrade.

## Golden Rule

Before writing or modifying any code:

1. Inspect the repository structure.
2. Read `package.json` and existing configuration.
3. Inspect `src/` and the relevant existing components/lib.
4. Read the relevant documentation in `docs/`.
5. Determine what already works and what is missing.
6. Create a concise plan. Do NOT blindly rewrite working code.

Never replace working features without inspection.

## Architecture

- Next.js (App Router) + React + TypeScript.
- `src/app` — routes. Business logic MUST NOT live in React components.
- `src/lib/backtesting` — isolated, framework-free backtest engine (deterministic).
- `src/lib/indicators` — reusable, tested indicator functions (no UI dependency).
- `src/lib/calculations` — financial calculations (P&L, R-multiple, drawdown, metrics).
- `src/components` — UI only. `ui/` for primitives, feature folders otherwise.
- `src/types` — shared TypeScript types.
- `src/store` — Zustand store only when global client state is actually needed.
- `supabase/migrations`, `supabase/seed` — schema migrations.
- `docs/` — also the Obsidian knowledge base (architecture, decisions, bugs, roadmap).

## Hard Requirements

- Strict TypeScript. No `any` in committed code.
- Deterministic engine: same data + same strategy + same config = same result.
- NO look-ahead bias. Never read future candles while evaluating the current candle.
- Financial calculations must be documented AND unit-tested (see `tests/unit`).
- Protect secrets. Never expose `SUPABASE_SERVICE_ROLE_KEY` to client code.
- Respect Supabase Row Level Security.
- UTC internally; convert to user timezone in UI only.

## Testing

- Run `npm run typecheck`, `npm run lint`, `npm run test` before declaring done.
- Test edge cases for financial formulas: zero trades, all wins, all losses, same-candle TP/SL, gaps, missing candles, zero commission, zero spread.

## Commit Style

Small meaningful commits:
`feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`.

Do not make one giant commit containing the entire application.

## Environment

- `.env.example` documents required variables. Never commit real secrets.
- Only `NEXT_PUBLIC_`-prefixed variables are safe for the browser.
