import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: lastRun } = await supabase
    .from("backtest_runs")
    .select("id, created_at, backtest_results(net_pnl, total_return, win_rate, trade_count), backtest_configs(symbol, timeframe)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count: dsCount } = await supabase
    .from("market_data_sets")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: runCount } = await supabase
    .from("backtest_runs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const res = (lastRun as Record<string, unknown> | null)?.backtest_results as
    | { net_pnl: number; total_return: number | null; win_rate: number | null; trade_count: number }[]
    | undefined;

  const metrics = res?.[0] as
    | { net_pnl: number; total_return: number | null; win_rate: number | null; trade_count: number }
    | undefined;

  const cfg = (lastRun as Record<string, unknown> | null)?.backtest_configs as
    | { symbol: string; timeframe: string }[]
    | undefined;

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-8">
      <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-sm text-muted-foreground">Signed in as {user.email ?? "unknown"}.</p>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Link href="/backtest" className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground">
          New Backtest
        </Link>
        <Link href="/market-data" className="rounded-md border border-border bg-card px-4 py-1.5 text-sm">
          Import Market Data
        </Link>
        <Link href="/strategies" className="rounded-md border border-border bg-card px-4 py-1.5 text-sm">
          Strategies
        </Link>
        <Link href="/results" className="rounded-md border border-border bg-card px-4 py-1.5 text-sm">
          View Results
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Datasets</p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{dsCount ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Saved runs</p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{runCount ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Last net P&L</p>
          <p className={`mt-1 font-mono text-lg font-semibold tabular-nums ${Number(metrics?.net_pnl ?? 0) >= 0 ? "text-chart-1" : "text-loss"}`}>
            {metrics ? Number(metrics.net_pnl).toFixed(2) : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Last win rate</p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
            {metrics?.win_rate !== null && metrics?.win_rate !== undefined ? `${Number(metrics.win_rate).toFixed(1)}%` : "—"}
          </p>
        </div>
      </div>

      {/* Last run */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Recent activity</h2>
        {!lastRun ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No backtest runs yet. Create a dataset and run a backtest to see activity here.
          </p>
        ) : (
          <div className="mt-2 space-y-1 text-sm">
            <p>
              Last run {String((lastRun as Record<string, unknown>).id).slice(0, 8)} · {new Date(String((lastRun as Record<string, unknown>).created_at)).toISOString().slice(0, 16).replace("T", " ")}
              {cfg?.[0] ? ` · ${cfg[0].symbol} ${cfg[0].timeframe}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              Net {metrics?.net_pnl ?? "—"} · Return {metrics?.total_return !== null && metrics?.total_return !== undefined ? `${Number(metrics.total_return).toFixed(2)}%` : "—"} · Trades{" "}
              {metrics?.trade_count ?? "—"}
            </p>
            <Link href="/results" className="text-xs text-primary underline">
              View all results
            </Link>
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground">Historical backtesting does not guarantee future performance.</p>
    </div>
  );
}
