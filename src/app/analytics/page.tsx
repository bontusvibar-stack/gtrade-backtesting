import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MonthlyHeatmap } from "@/components/analytics/monthly-heatmap";
import { EquityChart, DrawdownChart } from "@/components/backtest/equity-chart";
import type { EquityPoint, Trade } from "@/types/backtesting";

interface TradeRow {
  exit_time: string | null;
  net_pnl: number;
}
interface EquityRow {
  timestamp: string;
  equity: number;
  drawdown: number;
  drawdown_pct: number;
  balance: number;
  cumulative_pnl: number;
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: run } = await supabase
    .from("backtest_runs")
    .select("id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; created_at: string }>();

  let trades: TradeRow[] = [];
  let equity: EquityRow[] = [];
  if (run) {
    const { data: t } = await supabase
      .from("trades")
      .select("exit_time, net_pnl")
      .eq("backtest_run_id", run.id)
      .not("exit_time", "is", null);
    trades = (t ?? []) as TradeRow[];
    const { data: e } = await supabase
      .from("equity_points")
      .select("timestamp, equity, drawdown, drawdown_pct, balance, cumulative_pnl")
      .eq("backtest_run_id", run.id)
      .order("timestamp");
    equity = (e ?? []) as EquityRow[];
  }

  const equityPoints: EquityPoint[] = equity.map((p) => ({
    timestamp: new Date(p.timestamp).getTime(),
    equity: Number(p.equity),
    balance: Number(p.balance),
    cumulativePnl: Number(p.cumulative_pnl),
    drawdown: Number(p.drawdown),
    drawdownPct: Number(p.drawdown_pct),
  }));

  const byMonth = new Map<string, number>();
  for (const t of trades) {
    if (!t.exit_time) continue;
    const key = t.exit_time.slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + Number(t.net_pnl));
  }
  const months = Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, pnl]) => ({ key, pnl }));

  const grossWin = trades
    .filter((t) => t.net_pnl > 0)
    .reduce((s, t) => s + t.net_pnl, 0);
  const sumPnl = trades.reduce((s, t) => s + t.net_pnl, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-8">
      <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
      <p className="text-sm text-muted-foreground">
        Results from your most recent saved backtest. Generate data from the backtest
        workspace to see analytics here.
      </p>

      {!run ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          No saved backtests yet.{" "}
          <Link href="/backtest" className="text-primary underline">
            Run one
          </Link>
          .
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Source run {run.id.slice(0, 8)} · {new Date(run.created_at).toISOString().slice(0, 10)}
          </p>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Trades</p>
              <p className="mt-1 font-mono text-sm font-semibold tabular-nums">{trades.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Gross win</p>
              <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-chart-1">
                {grossWin.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Net P&L</p>
              <p
                className={`mt-1 font-mono text-sm font-semibold tabular-nums ${sumPnl >= 0 ? "text-chart-1" : "text-loss"}`}
              >
                {sumPnl.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-3">
            <h3 className="mb-2 text-sm font-semibold">Equity Curve</h3>
            {equityPoints.length > 0 ? (
              <EquityChart points={equityPoints} />
            ) : (
              <p className="text-sm text-muted-foreground">No equity data.</p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-3">
            <h3 className="mb-2 text-sm font-semibold">Drawdown %</h3>
            {equityPoints.length > 0 ? (
              <DrawdownChart points={equityPoints} />
            ) : (
              <p className="text-sm text-muted-foreground">No equity data.</p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-3">
            <h3 className="mb-2 text-sm font-semibold">Monthly Performance</h3>
            <MonthlyHeatmap months={months} />
          </div>
        </>
      )}
    </div>
  );
}
