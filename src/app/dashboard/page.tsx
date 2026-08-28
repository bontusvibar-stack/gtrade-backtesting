import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MotionDiv } from "@/components/dashboard/dashboard-motion";

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

  return (
    <div className="mx-auto max-w-6xl space-y-3 px-4 py-6">
      <MotionDiv><div className="flex items-end justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-xs text-white/40">Signed in as {user.email} · premium dark terminal</p>
        </div>
        <Link href="/backtest" className="rounded-md bg-white px-3.5 py-1.5 text-sm font-semibold text-black hover:bg-white/90 transition-all hover:scale-105">
          New Backtest →
        </Link>
      </div></MotionDiv>

      <MotionDiv delay={0.05}><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { href: "/backtest", t: "New Backtest", d: "Pilih dataset + LONG" },
          { href: "/market-data", t: "Market Data", d: "Import CSV / Demo" },
          { href: "/strategies", t: "Strategies", d: "4 demo + custom" },
          { href: "/results", t: "Results", d: `${runCount ?? 0} saved` },
        ].map((x) => (
          <Link key={x.t} href={x.href} className="group rounded-xl border border-white/[0.07] bg-[#151515] p-3 hover:bg-white/[0.04] transition-all hover:scale-[1.02] hover:border-white/15">
            <p className="text-xs font-semibold text-white group-hover:text-white">{x.t}</p>
            <p className="mt-1 text-xs text-white/40">{x.d}</p>
          </Link>
        ))}
      </div></MotionDiv>

      <MotionDiv delay={0.1}><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { k: "Datasets", v: String(dsCount ?? 0), sub: "di Market Data" },
          { k: "Saved runs", v: String(runCount ?? 0), sub: "di Results" },
          { k: "Last P&L", v: m ? Number(m.net_pnl).toFixed(2) : "—", tone: Number(m?.net_pnl ?? 0) >= 0 ? "profit" : "loss", sub: cfg?.[0] ? `${cfg[0].symbol} ${cfg[0].timeframe}` : "belum ada" },
          { k: "Win Rate", v: m?.win_rate !== null && m?.win_rate !== undefined ? `${Number(m.win_rate).toFixed(1)}%` : "—", sub: m ? `${m.trade_count} trades` : "—" },
        ].map((c, i) => (
          <MotionDiv key={c.k} delay={0.12 + i * 0.05}><div className="rounded-xl border border-white/[0.07] bg-[#151515] p-3 hover:border-white/15 transition-colors">
            <p className="text-[10px] uppercase tracking-widest text-white/35">{c.k}</p>
            <p className={`mt-1 font-mono text-base font-semibold tabular-nums ${c.tone === "profit" ? "text-emerald-400" : c.tone === "loss" ? "text-red-400" : "text-white"}`}>{c.v}</p>
            <p className="text-xs text-white/30">{c.sub}</p>
          </div></MotionDiv>
        ))}
      </div></MotionDiv>

      <MotionDiv delay={0.2}><div className="rounded-xl border border-white/[0.07] bg-[#151515] p-3 hover:border-white/10 transition-colors">
        <h2 className="text-xs font-semibold tracking-wide text-white/70">Performance</h2>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {[
            { k: "Return", v: m?.total_return !== null && m?.total_return !== undefined ? `${Number(m.total_return).toFixed(2)}%` : "—" },
            { k: "PF", v: m?.profit_factor !== null && m?.profit_factor !== undefined ? Number(m.profit_factor).toFixed(2) : "—" },
            { k: "Sharpe", v: m?.sharpe !== null && m?.sharpe !== undefined ? Number(m.sharpe).toFixed(2) : "—" },
            { k: "Max DD", v: m?.max_drawdown_pct !== null && m?.max_drawdown_pct !== undefined ? `${Number(m.max_drawdown_pct).toFixed(1)}%` : "—" },
            { k: "Trades", v: m ? String(m.trade_count) : "—" },
            { k: "Engine", v: hasData ? "v0.2.0" : "—" },
          ].map((x) => (
            <div key={x.k} className="rounded-lg bg-white/[0.04] px-2.5 py-2 hover:bg-white/[0.06] transition-colors">
              <p className="text-[10px] uppercase tracking-wide text-white/30">{x.k}</p>
              <p className="mt-0.5 font-mono text-xs font-semibold tabular-nums text-white/80">{x.v}</p>
            </div>
          ))}
        </div>
        {!hasData && <p className="mt-2 text-xs text-white/25">Jalankan backtest sekali untuk mengisi panel ini.</p>}
      </div></MotionDiv>

      <MotionDiv delay={0.25}><div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-white/[0.07] bg-[#151515] p-3 lg:col-span-2 hover:border-white/10 transition-colors">
          <h2 className="text-xs font-semibold tracking-wide text-white/70">Equity · Drawdown · Monthly</h2>
          {!hasData ? (
            <div className="mt-3 grid gap-2">
              <div className="h-24 rounded-lg bg-white/[0.03] p-2">
                <div className="h-full w-full rounded bg-gradient-to-r from-emerald-500/10 via-white/[0.04] to-transparent animate-pulse" />
                <p className="mt-1 text-center text-xs text-white/25">Equity curve muncul setelah Run Backtest</p>
              </div>
              <div className="h-16 rounded-lg bg-white/[0.03] p-2">
                <div className="h-full w-full rounded bg-gradient-to-r from-red-500/10 via-white/[0.04] to-transparent animate-pulse" />
              </div>
              <div className="grid grid-cols-8 gap-1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-8 rounded bg-white/[0.04] animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-white/40">Lihat Analytics untuk equity/drawdown/monthly penuh.</p>
          )}
          <Link href="/analytics" className="mt-2 inline-block text-xs text-white/50 underline hover:text-white">
            Open Analytics →
          </Link>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-[#151515] p-3 hover:border-white/10 transition-colors">
          <h2 className="text-xs font-semibold tracking-wide text-white/70">Recent backtests</h2>
          {!recentRuns || recentRuns.length === 0 ? (
            <p className="mt-2 text-sm text-white/30">Belum ada. Klik New Backtest → pilih Long & Hold → Run.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {(recentRuns as unknown as { id: string; created_at: string; backtest_configs: { symbol: string; timeframe: string }[] | null; backtest_results: { net_pnl: number }[] | null }[]).map((r) => (
                <Link key={r.id} href={`/results/${r.id}`} className="flex items-center justify-between rounded-lg bg-white/[0.04] px-2.5 py-2 hover:bg-white/[0.07] transition-all hover:translate-x-1">
                  <span className="text-xs font-mono text-white/60">{r.id.slice(0, 6)} · {r.backtest_configs?.[0]?.symbol ?? "—"}</span>
                  <span className={`text-xs font-mono tabular-nums ${Number(r.backtest_results?.[0]?.net_pnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>{r.backtest_results?.[0] ? Number(r.backtest_results[0].net_pnl).toFixed(0) : "—"}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div></MotionDiv>

      <p className="text-[10px] text-white/20">Historical backtesting does not guarantee future performance.</p>
    </div>
  );
}
