-- ============================================================================
-- GTrade — Migration 002: Row Level Security + helper triggers
-- Rule: users can only access rows where user_id = auth.uid().
-- NEVER trust client-provided user IDs — RLS enforces server-side.
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.strategies enable row level security;
alter table public.strategy_versions enable row level security;
alter table public.market_data_sources enable row level security;
alter table public.market_data_sets enable row level security;
alter table public.backtest_runs enable row level security;
alter table public.backtest_configs enable row level security;
alter table public.backtest_results enable row level security;
alter table public.trades enable row level security;
alter table public.equity_points enable row level security;
alter table public.optimization_runs enable row level security;
alter table public.optimization_results enable row level security;
alter table public.user_preferences enable row level security;

-- ----------------------------------------------------------------------------
-- Auto-create profile on signup
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- RLS policies (user-scoped)
-- ----------------------------------------------------------------------------
create policy "profiles_self" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "strategies_owner" on public.strategies
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "strategy_versions_owner" on public.strategy_versions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "market_data_sources_owner" on public.market_data_sources
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "market_data_sets_owner" on public.market_data_sets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "backtest_runs_owner" on public.backtest_runs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "backtest_configs_owner" on public.backtest_configs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "backtest_results_owner" on public.backtest_results
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "trades_owner" on public.trades
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "equity_points_owner" on public.equity_points
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "optimization_runs_owner" on public.optimization_runs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "optimization_results_owner" on public.optimization_results
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_preferences_self" on public.user_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
