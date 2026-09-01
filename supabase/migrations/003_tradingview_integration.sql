-- Migration 003: GTrade TradingView Integration
-- Modular: provider-agnostic, no fake TradingView data, proper RLS, idempotency, audit

-- Trading accounts (user can have multiple, broker abstraction via adapter)
create table if not exists public.trading_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  broker text, -- oanda | tradingview | manual
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);

-- TradingView connections (user ↔ external provider)
create table if not exists public.tradingview_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'tradingview', -- tradingview | oanda
  provider_account_id text,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, provider)
);

-- TradingView alerts config (user creates alert builder entries)
create table if not exists public.tradingview_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  symbol text not null,
  condition text not null,
  timeframe text not null,
  action text not null, -- BUY | SELL
  stop_loss numeric(24,8),
  take_profit numeric(24,8),
  strategy text,
  webhook_url text,
  created_at timestamptz not null default now()
);

-- Trading signals (from webhook, validated)
create table if not exists public.trading_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  symbol text not null,
  action text not null check (action in ('BUY','SELL')),
  entry_price numeric(24,8) not null,
  timeframe text not null,
  strategy text,
  stop_loss numeric(24,8),
  take_profit numeric(24,8),
  source text not null default 'tradingview',
  event_id text, -- idempotency key (payload hash or TradingView event_id)
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, event_id)
);

-- Journal trades (user confirms signal → trade)
create table if not exists public.journal_trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  signal_id uuid references public.trading_signals(id) on delete set null,
  symbol text not null,
  direction text not null check (direction in ('BUY','SELL')),
  entry_price numeric(24,8) not null,
  exit_price numeric(24,8),
  stop_loss numeric(24,8),
  take_profit numeric(24,8),
  quantity numeric(24,8),
  timeframe text,
  strategy text,
  market_condition text,
  notes text,
  emotion text,
  result text, -- WIN | LOSS | BREAKEVEN | OPEN
  pnl numeric(24,8),
  rr numeric(12,6),
  risk numeric(12,6),
  created_at timestamptz not null default now()
);

-- Screenshots for trades (Supabase Storage, not blob)
create table if not exists public.trade_screenshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trade_id uuid not null references public.journal_trades(id) on delete cascade,
  kind text not null check (kind in ('entry','during','exit')),
  storage_path text not null,
  created_at timestamptz not null default now()
);

-- Webhook logs (audit, rate limit, error tracking)
create table if not exists public.webhook_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  event_id text,
  payload jsonb,
  status text not null, -- SUCCESS | BAD_REQUEST | UNAUTHORIZED | RATE_LIMITED | SERVER_ERROR | DUPLICATE
  error text,
  ip text,
  created_at timestamptz not null default now()
);

-- Audit logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Storage bucket for screenshots (create if not exists via SQL)
insert into storage.buckets (id, name, public) values ('trade-screenshots', 'trade-screenshots', false) on conflict (id) do nothing;

-- Indexes
create index if not exists idx_trading_signals_user on public.trading_signals(user_id);
create index if not exists idx_trading_signals_symbol on public.trading_signals(symbol);
create index if not exists idx_journal_trades_user on public.journal_trades(user_id);
create index if not exists idx_webhook_logs_event on public.webhook_logs(event_id);
create index if not exists idx_webhook_logs_created on public.webhook_logs(created_at);

-- RLS
alter table public.trading_accounts enable row level security;
alter table public.tradingview_connections enable row level security;
alter table public.tradingview_alerts enable row level security;
alter table public.trading_signals enable row level security;
alter table public.journal_trades enable row level security;
alter table public.trade_screenshots enable row level security;
alter table public.webhook_logs enable row level security;
alter table public.audit_logs enable row level security;

create policy "trading_accounts_owner" on public.trading_accounts for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "tv_connections_owner" on public.tradingview_connections for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "tv_alerts_owner" on public.tradingview_alerts for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "signals_owner" on public.trading_signals for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "journal_owner" on public.journal_trades for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "screenshots_owner" on public.trade_screenshots for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "webhook_logs_owner" on public.webhook_logs for select using (auth.uid()=user_id);
create policy "audit_owner" on public.audit_logs for select using (auth.uid()=user_id);

-- Storage RLS for screenshots bucket
create policy "screenshots_storage_owner" on storage.objects for all using (bucket_id='trade-screenshots' and auth.uid()::text = (storage.foldername(name))[1]) with check (bucket_id='trade-screenshots' and auth.uid()::text = (storage.foldername(name))[1]);
