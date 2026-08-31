import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CommandCenter } from "@/components/workspace/CommandCenter";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-6">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-6">
          <h1 className="text-lg font-semibold text-amber-700 dark:text-amber-300">Supabase not configured</h1>
          <p className="mt-2 text-sm text-amber-700/80 dark:text-amber-300/80">Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in Vercel → Settings → Environment Variables, then redeploy. Locally, copy <code>.env.example</code> to <code>.env.local</code>.</p>
          <Link href="/login" className="mt-4 inline-block rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-black">Go to Login</Link>
        </div>
      </div>
    );
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let lastRun: unknown = null; let dsCount: number | null = 0; let runCount: number | null = 0; let recentRuns: unknown[] | null = [];
  try {
    const r1 = await supabase.from("backtest_runs").select("id, created_at, backtest_results(net_pnl, total_return, win_rate, trade_count, profit_factor, sharpe, max_drawdown_pct), backtest_configs(symbol, timeframe)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    lastRun = r1.data;
    const r2 = await supabase.from("market_data_sets").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    dsCount = r2.count;
    const r3 = await supabase.from("backtest_runs").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    runCount = r3.count;
    const r4 = await supabase.from("backtest_runs").select("id, created_at, backtest_configs(symbol, timeframe), backtest_results(net_pnl, trade_count)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3);
    recentRuns = r4.data as unknown[] | null;
  } catch {
    // graceful fallback if fetch fails
  }

  const res = (lastRun as Record<string, unknown> | null)?.backtest_results as
    | { net_pnl: number; total_return: number | null; win_rate: number | null; trade_count: number; profit_factor: number | null; sharpe: number | null; max_drawdown_pct: number | null }[]
    | undefined;
  const m = res?.[0];
  const cfg = (lastRun as Record<string, unknown> | null)?.backtest_configs as { symbol: string; timeframe: string }[] | undefined;

  const hasData = !!lastRun && !!m;

  const recent = ((recentRuns as unknown as { id: string; created_at: string; backtest_configs: { symbol: string; timeframe: string }[] | null; backtest_results: { net_pnl: number }[] | null }[]) ?? []).map((r) => ({
    id: r.id,
    created_at: r.created_at,
    symbol: r.backtest_configs?.[0]?.symbol ?? "—",
    pnl: Number(r.backtest_results?.[0]?.net_pnl ?? 0),
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <CommandCenter
        userEmail={user.email ?? undefined}
        stats={{
          dsCount: dsCount ?? 0,
          runCount: runCount ?? 0,
          lastPnl: m ? Number(m.net_pnl).toFixed(2) : null,
          winRate: m?.win_rate != null ? `${Number(m.win_rate).toFixed(1)}%` : null,
          lastSymbol: cfg?.[0] ? `${cfg[0].symbol} ${cfg[0].timeframe}` : null,
          totalReturn: m?.total_return != null ? `${Number(m.total_return).toFixed(2)}%` : null,
          profitFactor: m?.profit_factor != null ? Number(m.profit_factor).toFixed(2) : null,
          sharpe: m?.sharpe != null ? Number(m.sharpe).toFixed(2) : null,
          maxDd: m?.max_drawdown_pct != null ? `${Number(m.max_drawdown_pct).toFixed(1)}%` : null,
          hasData,
        }}
        recentRuns={recent}
      />
    </div>
  );
}
