"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Play, BarChart3, TrendingUp, Activity, Zap, ArrowUpRight } from "lucide-react";

interface CommandCenterProps {
  userEmail?: string;
  stats: {
    dsCount: number;
    runCount: number;
    lastPnl: string | null;
    winRate: string | null;
    lastSymbol: string | null;
    totalReturn: string | null;
    profitFactor: string | null;
    sharpe: string | null;
    maxDd: string | null;
    hasData: boolean;
  };
  recentRuns: { id: string; created_at: string; symbol: string; pnl: number }[];
}

export function CommandCenter({ userEmail, stats, recentRuns }: CommandCenterProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
        <div>
          <h1 className="text-sm font-bold tracking-widest text-white">COMMAND CENTER</h1>
          <p className="text-[11px] tracking-wide text-white/40">Market + Backtest Intelligence</p>
          {userEmail && <p className="mt-1 text-[11px] text-emerald-400/60">{userEmail} · connected</p>}
        </div>
        <div className="flex gap-2">
          <Link href="/backtest" className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-black hover:bg-emerald-400 transition">
            <Play className="w-3 h-3" /> Run Backtest
          </Link>
          <Link href="/strategies" className="hidden md:inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/70 hover:bg-white/10">New Strategy</Link>
        </div>
      </motion.div>

      {/* KPI Row - compact trading terminal */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="grid grid-cols-3 gap-2 md:grid-cols-6">
        {[
          { k: "BALANCE", v: stats.hasData ? stats.lastPnl ?? "—" : "—", sub: "last P&L" },
          { k: "EQUITY", v: stats.hasData ? stats.totalReturn ?? "—" : "—", sub: "total return" },
          { k: "WIN RATE", v: stats.winRate ?? "—", sub: "overall" },
          { k: "PF", v: stats.profitFactor ?? "—", sub: "profit factor" },
          { k: "MAX DD", v: stats.maxDd ?? "—", sub: "drawdown" },
          { k: "TRADES", v: stats.hasData ? String(recentRuns.length) : "—", sub: "recent" },
        ].map((x) => (
          <div key={x.k} className="rounded-xl border border-white/[0.06] bg-[#151515] px-3 py-2.5">
            <p className="text-[10px] tracking-widest text-white/30">{x.k}</p>
            <p className="mt-1 font-mono text-sm font-semibold text-white">{x.v}</p>
            <p className="text-[10px] text-white/30">{x.sub}</p>
          </div>
        ))}
      </motion.div>

      {/* Main Grid */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Market Overview Large chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-8 rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold tracking-widest text-white/60">MARKET OVERVIEW</h2>
            <span className="text-[10px] text-emerald-400/70">XAUUSD · M15 · LIVE</span>
          </div>
          <div className="mt-3 h-[280px] rounded-lg bg-[#0a0a0a] border border-white/[0.04] flex flex-col items-center justify-center">
            <div className="w-full h-full rounded bg-gradient-to-b from-emerald-500/[0.06] to-transparent p-3">
              <div className="h-full flex items-end gap-0.5">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-emerald-500/30" style={{ height: `${20 + (Math.sin(i*0.6)+1)*35}%` }} />
                ))}
              </div>
              <p className="mt-2 text-center text-[11px] text-white/30">Chart — connects to TradingView-style engine</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2 text-[11px]">
            <span className="rounded bg-white/[0.06] px-2 py-1 text-white/60">Balance {stats.lastPnl ?? "—"}</span>
            <span className="rounded bg-emerald-500/10 px-2 py-1 text-emerald-300">Win Rate {stats.winRate ?? "—"}</span>
            <span className="rounded bg-white/[0.06] px-2 py-1 text-white/60">PF {stats.profitFactor ?? "—"}</span>
          </div>
        </motion.div>

        {/* Recent Backtests + Session */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }} className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4">
            <h3 className="text-xs font-semibold tracking-widest text-white/60">RECENT BACKTESTS</h3>
            <div className="mt-3 space-y-2">
              {recentRuns.length === 0 ? (
                <p className="text-xs text-white/30">No sessions yet. Run first backtest.</p>
              ) : recentRuns.map((r) => (
                <Link key={r.id} href={`/results/${r.id}`} className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2.5 hover:bg-white/[0.07]">
                  <span className="text-xs font-mono text-white/70">{r.symbol} · {r.id.slice(0, 6)}</span>
                  <span className={`text-xs font-mono ${r.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{r.pnl >= 0 ? "+" : ""}{r.pnl.toFixed(0)}</span>
                </Link>
              ))}
            </div>
            <Link href="/results" className="mt-3 inline-flex items-center gap-1 text-[11px] text-emerald-400/70 hover:text-emerald-300">View all <ArrowUpRight className="w-3 h-3" /></Link>
          </div>

          <div className="rounded-xl border border-emerald-900/30 bg-emerald-950/20 p-4">
            <h3 className="text-xs font-semibold tracking-widest text-emerald-300/70">ACTIVE SESSIONS</h3>
            <p className="mt-2 text-xs text-white/50">{stats.dsCount} datasets · {stats.runCount} saved runs</p>
            <div className="mt-3 flex gap-2">
              <Link href="/market-data" className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-black">Manage Data</Link>
              <Link href="/compare" className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/70">Compare</Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Performance */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8 rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4">
          <h3 className="text-xs font-semibold tracking-widest text-white/60">PERFORMANCE</h3>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {[
              { k: "Equity Curve", icon: <TrendingUp className="w-4 h-4" /> },
              { k: "Drawdown", icon: <Activity className="w-4 h-4" /> },
              { k: "Trade Stats", icon: <BarChart3 className="w-4 h-4" /> },
            ].map((x) => (
              <div key={x.k} className="rounded-lg bg-white/[0.03] p-3 border border-white/[0.04]">
                <div className="text-emerald-400/60">{x.icon}</div>
                <p className="mt-2 text-xs font-medium text-white/70">{x.k}</p>
                <div className="mt-2 h-12 rounded bg-gradient-to-r from-emerald-500/10 to-transparent" />
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4">
          <h3 className="text-xs font-semibold tracking-widest text-white/60">QUICK ACTIONS</h3>
          <div className="mt-3 grid gap-2">
            <Link href="/optimize" className="rounded-lg bg-white/[0.04] px-3 py-2.5 text-xs hover:bg-white/[0.07]">Optimize Parameters →</Link>
            <Link href="/monte-carlo" className="rounded-lg bg-white/[0.04] px-3 py-2.5 text-xs hover:bg-white/[0.07]">Monte Carlo →</Link>
            <Link href="/analytics" className="rounded-lg bg-white/[0.04] px-3 py-2.5 text-xs hover:bg-white/[0.07]">Analytics →</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
