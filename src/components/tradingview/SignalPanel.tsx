"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface SignalRow {
  id: string;
  symbol: string;
  action: "BUY" | "SELL";
  entry_price: number;
  timeframe: string;
  strategy: string | null;
  stop_loss: number | null;
  take_profit: number | null;
  received_at: string;
}

export function SignalPanel({ initial }: { initial?: SignalRow[] }) {
  const [signals, setSignals] = useState<SignalRow[]>(initial ?? []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("trading_signals").on("postgres_changes", { event: "INSERT", schema: "public", table: "trading_signals" }, payload => {
      const row = payload.new as SignalRow;
      setSignals(prev => [row, ...prev].slice(0, 20));
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (signals.length === 0) {
    return <div className="rounded-xl border border-white/[0.06] bg-[#151515] p-6 text-center text-sm text-white/40">No signals yet. Create alert in TradingView → webhook.</div>;
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {signals.map(s => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} className="rounded-xl border border-white/[0.06] bg-[#151515] p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{s.symbol}</p>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${s.action === "BUY" ? "bg-emerald-500 text-black" : "bg-red-500 text-white"}`}>{s.action}</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <span className="text-white/50">Entry <span className="font-mono text-white">{Number(s.entry_price).toFixed(2)}</span></span>
              <span className="text-white/50">TF <span className="font-mono text-white">{s.timeframe}</span></span>
              {s.strategy && <span className="text-white/50">Strategy <span className="text-white">{s.strategy}</span></span>}
              {s.stop_loss != null && <span className="text-white/50">SL <span className="font-mono text-white">{Number(s.stop_loss).toFixed(2)}</span></span>}
              {s.take_profit != null && <span className="text-white/50">TP <span className="font-mono text-white">{Number(s.take_profit).toFixed(2)}</span></span>}
            </div>
            <p className="mt-2 text-[11px] text-white/30">Received {new Date(s.received_at).toLocaleString()}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
