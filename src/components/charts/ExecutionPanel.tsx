"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

export function ExecutionPanel() {
  const [side, setSide] = useState<"long" | "short">("long");
  const [order, setOrder] = useState<"market" | "limit">("market");
  const [sl, setSl] = useState("1.08420");
  const [tp, setTp] = useState("1.08680");
  const [risk, setRisk] = useState("1");
  const [price] = useState(1.08540);

  const rr = useMemo(() => {
    const slD = Math.abs(parseFloat(sl) - price);
    const tpD = Math.abs(parseFloat(tp) - price);
    if (!slD || !tpD) return "—";
    return (tpD / slD).toFixed(2);
  }, [sl, tp, price]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-[320px] rounded-2xl border border-white/10 bg-[#121212] shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white">New Trade</h3>
        <span className="text-xs text-white/40">EURAUD · 15M</span>
      </div>

      <div className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setSide("long")} className={`rounded-full py-2 text-sm font-semibold ${side === "long" ? "bg-emerald-500 text-black" : "bg-white/10 text-white/60"}`}>Long</button>
          <button onClick={() => setSide("short")} className={`rounded-full py-2 text-sm font-semibold ${side === "short" ? "bg-red-500 text-white" : "bg-white/10 text-white/60"}`}>Short</button>
        </div>

        <div className="flex gap-1 rounded-full bg-white/[0.06] p-1">
          <button onClick={() => setOrder("market")} className={`flex-1 rounded-full py-1 text-xs font-medium ${order === "market" ? "bg-white text-black" : "text-white/60"}`}>Market</button>
          <button onClick={() => setOrder("limit")} className={`flex-1 rounded-full py-1 text-xs font-medium ${order === "limit" ? "bg-white text-black" : "text-white/60"}`}>Limit</button>
        </div>

        <label className="block text-xs text-white/60">Stop Loss<input value={sl} onChange={(e) => setSl(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-sm text-white" /></label>
        <label className="block text-xs text-white/60">Take Profit<input value={tp} onChange={(e) => setTp(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-sm text-white" /></label>

        <label className="block text-xs text-white/60">Risk % of balance<input value={risk} onChange={(e) => setRisk(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" /></label>

        <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2">
          <span className="text-xs text-amber-300">Risk : Reward</span>
          <span className="rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-black">1 : {rr}</span>
        </div>

        <button className={`w-full rounded-full py-2.5 text-sm font-semibold ${side === "long" ? "bg-emerald-500 text-black hover:bg-emerald-400" : "bg-red-500 text-white hover:bg-red-400"}`}>Place {side === "long" ? "Long" : "Short"} Order</button>
      </div>
    </motion.div>
  );
}

export function MagnetBadge() {
  return (
    <div className="pointer-events-none fixed bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-white/10 bg-[#121212] px-3 py-1.5 text-xs shadow-lg">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
      <span className="tracking-wide text-white/70">Magnet On</span>
      <span className="font-mono text-white/30">1.08420 · 1.08680</span>
    </div>
  );
}
