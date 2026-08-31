"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Dice5, EyeOff, Target, Telescope, Shuffle } from "lucide-react";

type Props = { open: boolean; onClose: () => void; onStart?: (type: string) => void };

const TYPES = [
  { id: "normal", label: "Normal", desc: "Standard historical replay", icon: <Target className="w-5 h-5" /> },
  { id: "random", label: "Fully Random", desc: "Shuffled candles for bias test", icon: <Shuffle className="w-5 h-5" /> },
  { id: "prop", label: "Prop Firm Challenge", desc: "Profit target + max drawdown rules", icon: <Target className="w-5 h-5" /> },
  { id: "blind", label: "Blind Backtest", desc: "No forward info, pure execution", icon: <EyeOff className="w-5 h-5" /> },
  { id: "explore", label: "Explore Charts", desc: "Browse without scoring", icon: <Telescope className="w-5 h-5" /> },
];

export function BacktestWizard({ open, onClose, onStart }: Props) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState("random");
  const [pair, setPair] = useState("EURUSD");
  const [range, setRange] = useState("2024-01-01 → 2024-12-31");
  const [balance, setBalance] = useState("10000");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#121212] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-sm font-semibold tracking-widest text-white">NEW BACKTEST SESSION</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/10"><X className="w-4 h-4 text-white/60" /></button>
        </div>

        <div className="px-6 pt-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="flex flex-1 items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${n === step ? "bg-amber-500 text-black shadow-[0_0_16px_rgba(245,158,11,0.5)]" : n < step ? "bg-emerald-500 text-black" : "bg-white/10 text-white/40"}`}>{n}</div>
                {n < 5 && <div className={`h-px flex-1 ${n < step ? "bg-emerald-500/40" : "bg-white/10"}`} />}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] tracking-widest text-white/30">
            <span>Backtesting Type</span><span>Trading Pair</span><span>Date Range</span><span>Initial Balance</span><span>Review & Start</span>
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="grid gap-3 md:grid-cols-3">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={`rounded-xl border p-4 text-left transition ${type === t.id ? "border-amber-500/60 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.3)]" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"}`}
                >
                  <div className={`${type === t.id ? "text-amber-400" : "text-white/60"}`}>{t.icon}</div>
                  <p className="mt-2 text-sm font-medium text-white">{t.label}</p>
                  <p className="text-xs text-white/40">{t.desc}</p>
                </button>
              ))}
            </div>
          )}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-white/70">Trading Pair</p>
              <div className="grid grid-cols-3 gap-2">
                {["EURUSD", "EURGBP", "EURAUD", "GBPUSD", "XAUUSD", "BTCUSD"].map((p) => (
                  <button key={p} onClick={() => setPair(p)} className={`rounded-lg border px-3 py-2.5 text-sm ${pair === p ? "border-amber-500/50 bg-amber-500/10 text-amber-300" : "border-white/10 bg-white/[0.04] text-white/70"}`}>{p}</button>
                ))}
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-white/70">Date Range</p>
              <input value={range} onChange={(e) => setRange(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
              <p className="text-xs text-white/30">Use historical data only — no future leakage</p>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm text-white/70">Initial Balance</p>
              <input value={balance} onChange={(e) => setBalance(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
            </div>
          )}
          {step === 5 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm">
              <p className="text-white/70">Review</p>
              <p className="mt-1 font-mono text-xs text-white">{type} · {pair} · {range} · ${balance}</p>
              <p className="mt-2 text-xs text-white/40">Starting will create a new session and load the chart.</p>
            </div>
          )}
        </div>

        <div className="flex justify-between border-t border-white/10 px-6 py-4">
          <button onClick={() => (step > 1 ? setStep(step - 1) : onClose())} className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-white/70">Back</button>
          <button onClick={() => (step < 5 ? setStep(step + 1) : (onStart?.(type), onClose()))} className="rounded-full bg-amber-500 px-5 py-1.5 text-sm font-semibold text-black hover:bg-amber-400">
            {step < 5 ? "Continue" : "Start Session"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
