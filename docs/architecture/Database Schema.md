# Database Schema (PLANNED)

> **STATUS: PLANNED** — This schema is the proposed design for the Supabase backend. It has not yet been implemented. Migrations will be added to `supabase/migrations` as work progresses.

All tables use `uuid` primary keys, are owned by a user (via `auth.users` foreign key), carry `created_at` / `updated_at` timestamps, and are protected by **Row Level Security (RLS)**.

## Entities

### `profiles`
- `id uuid` (FK `auth.users.id`, PK)
- `display_name text`
- `created_at timestamptz`, `updated_at timestamptz`
- One row per Supabase auth user.

### `strategies`
- `id uuid` (PK)
- `owner_id uuid` (FK `profiles.id`)
- `name text`, `description text`
- `created_at`, `updated_at`

### `strategy_versions`
- `id uuid` (PK)
- `strategy_id uuid` (FK `strategies.id`)
- `version int`, `parameters jsonb`, `code text`
- `created_at`

### `market_data_sources`
- `id uuid` (PK)
- `owner_id uuid`
- `name text`, `type text` (e.g. csv, api)
- `config jsonb`
- `created_at`, `updated_at`

### `market_data_sets`
- `id uuid` (PK)
- `source_id uuid` (FK `market_data_sources.id`)
- `symbol text`, `timeframe text`, `instrument_type text`
- `created_at`

### `backtest_configs`
- `id uuid` (PK)
- `owner_id uuid`
- `strategy_version_id uuid` (FK `strategy_versions.id`)
- `market_data_set_id uuid` (FK `market_data_sets.id`)
- `settings jsonb` (capital, spread, commission, slippage, etc.)
- `created_at`

### `backtest_runs`
- `id uuid` (PK)
- `config_id uuid` (FK `backtest_configs.id`)
- `status text` (pending, running, done, failed)
- `started_at`, `finished_at`
- `created_at`

### `backtest_results`
- `id uuid` (PK)
- `run_id uuid` (FK `backtest_runs.id`)
- `metrics jsonb` (net profit, sharpe, drawdown, etc.)
- `created_at`

### `trades`
- `id uuid` (PK)
- `run_id uuid` (FK `backtest_runs.id`)
- `side text`, `open_at`, `close_at`, `open_price`, `close_price`, `size`, `pnl`, `pnl_pct`
- `created_at`

### `equity_points`
- `id uuid` (PK)
- `run_id uuid` (FK `backtest_runs.id`)
- `timestamp`, `equity numeric`, `drawdown numeric`
- `created_at`

### `optimization_runs`
- `id uuid` (PK)
- `config_id uuid` (FK `backtest_configs.id`)
- `param_space jsonb`, `status text`
- `created_at`, `finished_at`

### `optimization_results`
- `id uuid` (PK)
- `optimization_run_id uuid` (FK `optimization_runs.id`)
- `parameters jsonb`, `score numeric`, `metrics jsonb`
- `created_at`

### `user_preferences`
- `owner_id uuid` (PK, FK `profiles.id`)
- `prefs jsonb` (UI theme, default timeframe, etc.)
- `updated_at`

## Conventions
- All timestamps are `timestamptz` (UTC).
- Every table with user-owned data has an `owner_id` and RLS policies enforcing isolation.
- Migrations are stored in `supabase/migrations` and applied via the Supabase CLI.
