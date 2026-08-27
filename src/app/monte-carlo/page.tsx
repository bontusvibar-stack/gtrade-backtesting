import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { runMonteCarlo } from "@/lib/calculations/monte-carlo";

interface RunRow {
  id: string;
  created_at: string;
  backtest_configs: { symbol: string; timeframe: string; starting_balance: number }[] | null;
}

export default async function MonteCarloPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: runs } = await supabase
    .from("backtest_runs")
    .select("id, created_at, backtest_configs(symbol, timeframe, starting_balance)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)
    .returns<RunRow[]>();

  const run = runs?.[0];
  const { data: trades } = run
    ? await supabase.from("trades").select("net_pnl").eq("backtest_run_id", run.id).order("entry_time")
    : { data: [] as { net_pnl: number }[] };

  const start = Number(run?.backtest_configs?.[0]?.starting_balance ?? 10000);
  const pnls = (trades ?? []).map((t) => Number(t.net_pnl));
  const mc = pnls.length >= 2 ? runMonteCarlo(pnls, start, { simulations: 1000, seed: 42 }) : null;

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-8">
      <h1 className="text-xl font-semibold tracking-tight">Monte Carlo</h1>
      <p className="text-sm text-muted-foreground">Resamples/reorders historical trade outcomes. Not a prediction.</p>
      {!run || !mc ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">Need a saved backtest with at least 2 trades.</div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">Source {run.id.slice(0, 8)} · {run.backtest_configs?.[0]?.symbol} {run.backtest_configs?.[0]?.timeframe} · {pnls.length} trades · 1,000 simulations</p>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["Median", mc.medianReturn],
              ["Best", mc.bestReturn],
              ["Worst", mc.worstReturn],
              ["P5", mc.p5],
              ["P95", mc.p95],
              ["Profit Prob", mc.probProfit * 100],
            ].map(([k, v]) => (
              <div key={String(k)} className="rounded-lg border border-border bg-card p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</p>
                <p className="mt-1 font-mono text-sm font-semibold tabular-nums">{Number(v).toFixed(2)}{k === "Profit Prob" ? "%" : ""}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <h2 className="text-sm font-semibold">Drawdown Risk</h2>
            <p className="mt-1 text-xs text-muted-foreground">Probability of drawdown &gt; 20%: {(mc.probDrawdownOver20 * 100).toFixed(1)}%</p>
            <p className="mt-2 text-[10px] text-muted-foreground">Simulation uses only saved trade ledger net PnL. No future data. No fabricated market data.</p>
          </div>
        </>
      )}
    </div>
  );
}
