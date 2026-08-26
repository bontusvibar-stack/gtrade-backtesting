-- ============================================================================
-- GTrade — Migration 001: Core schema + Row Level Security
-- Engine/result schema versioning recorded via engine_version column.
-- All timestamps UTC. All user-owned rows filtered by auth.uid().
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- profiles: 1:1 with auth.users
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  timezone text not null default 'UTC',
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- strategies
-- ----------------------------------------------------------------------------
create table if not exists public.strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  category text,                  -- sma_crossover | rsi | breakout | custom
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.strategy_versions (
  id uuid primary key default gen_random_uuid(),
  strategy_id uuid not null references public.strategies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  version integer not null,
  parameters jsonb not null default '{}'::jsonb,
  code text,                     -- strategy implementation reference / config
  created_at timestamptz not null default now(),
  unique (strategy_id, version)
);

-- ----------------------------------------------------------------------------
-- market data
-- ----------------------------------------------------------------------------
create table if not exists public.market_data_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  provider text,                 -- csv | api | demo
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.market_data_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_id uuid references public.market_data_sources (id) on delete set null,
  symbol text not null,
  market_type text,              -- forex | crypto | equity | commodity
  timeframe text not null,       -- 1m | 5m | 1h | 1d ...
  candle_count integer not null default 0,
  start_time timestamptz,
  end_time timestamptz,
  is_demo boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- backtests
-- ----------------------------------------------------------------------------
create table if not exists public.backtest_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  strategy_id uuid references public.strategies (id) on delete set null,
  strategy_version_id uuid references public.strategy_versions (id) on delete set null,
  market_data_set_id uuid references public.market_data_sets (id) on delete set null,
  engine_version text not null,
  status text not null default 'complete',   -- running | complete | error
  created_at timestamptz not null default now()
);

create table if not exists public.backtest_configs (
  id uuid primary key default gen_random_uuid(),
  backtest_run_id uuid not null references public.backtest_runs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  symbol text not null,
  market_type text,
  timeframe text not null,
  date_range jsonb,
  starting_balance numeric(24,8) not null,
  currency text not null default 'USD',
  risk jsonb not null default '{}'::jsonb,
  execution jsonb not null default '{}'::jsonb,
  strategy_parameters jsonb not null default '{}'::jsonb,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.backtest_results (
  id uuid primary key default gen_random_uuid(),
  backtest_run_id uuid not null references public.backtest_runs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  net_pnl numeric(24,8) not null default 0,
  total_return numeric(12,6),
  win_rate numeric(7,4),
  profit_factor numeric(18,6),
  expectancy numeric(24,8),
  average_r numeric(12,6),
  max_drawdown numeric(24,8),
  max_drawdown_pct numeric(9,4),
  recovery_factor numeric(12,6),
  sharpe numeric(12,6),
  sortino numeric(12,6),
  trade_count integer not null default 0,
  metrics jsonb not null default '{}'::jsonb,
  warnings text[],
  created_at timestamptz not null default now()
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  backtest_run_id uuid not null references public.backtest_runs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  symbol text not null,
  side text not null,            -- buy | sell
  entry_time timestamptz not null,
  exit_time timestamptz,
  entry_price numeric(24,8) not null,
  exit_price numeric(24,8),
  quantity numeric(24,8) not null,
  stop_loss numeric(24,8),
  take_profit numeric(24,8),
  gross_pnl numeric(24,8),
  commission numeric(24,8) not null default 0,
  slippage numeric(24,8) not null default 0,
  net_pnl numeric(24,8),
  r_multiple numeric(12,6),
  duration interval,
  exit_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.equity_points (
  id uuid primary key default gen_random_uuid(),
  backtest_run_id uuid not null references public.backtest_runs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  timestamp timestamptz not null,
  balance numeric(24,8) not null,
  equity numeric(24,8) not null,
  cumulative_pnl numeric(24,8) not null,
  drawdown numeric(24,8) not null default 0,
  drawdown_pct numeric(9,4),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- optimization
-- ----------------------------------------------------------------------------
create table if not exists public.optimization_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  strategy_id uuid references public.strategies (id) on delete set null,
  market_data_set_id uuid references public.market_data_sets (id) on delete set null,
  target text not null,
  parameter_space jsonb not null,
  combination_count integer not null,
  status text not null default 'complete',
  created_at timestamptz not null default now()
);

create table if not exists public.optimization_results (
  id uuid primary key default gen_random_uuid(),
  optimization_run_id uuid not null references public.optimization_runs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rank integer not null,
  parameters jsonb not null,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- user preferences
-- ----------------------------------------------------------------------------
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme text not null default 'dark',
  reduced_motion boolean not null default false,
  chart_settings jsonb not null default '{}'::jsonb,
  backtest_defaults jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- indexes
-- ----------------------------------------------------------------------------
create index if not exists idx_strategies_user on public.strategies (user_id);
create index if not exists idx_strategy_versions_strategy on public.strategy_versions (strategy_id);
create index if not exists idx_market_data_sets_user on public.market_data_sets (user_id);
create index if not exists idx_backtest_runs_user on public.backtest_runs (user_id);
create index if not exists idx_backtest_configs_run on public.backtest_configs (backtest_run_id);
create index if not exists idx_backtest_results_run on public.backtest_results (backtest_run_id);
create index if not exists idx_trades_run on public.trades (backtest_run_id);
create index if not exists idx_equity_points_run on public.equity_points (backtest_run_id);
create index if not exists idx_optimization_runs_user on public.optimization_runs (user_id);
create index if not exists idx_optimization_results_run on public.optimization_results (optimization_run_id);
