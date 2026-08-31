"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Calendar, BarChart3, Star, BookOpen } from "lucide-react";

type Tab = "log" | "calendar" | "analytics" | "reviews";

export function TradeJournal() {
  const [tab, setTab] = useState<Tab>("log");

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex gap-2 border-b border-white/[0.06] px-1">
        {[
          { id: "log", label: "Log" },
          { id: "calendar", label: "Calendar" },
          { id: "analytics", label: "Analytics" },
          { id: "reviews", label: "Reviews" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as Tab)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${tab === t.id ? "text-white" : "text-white/40 hover:text-white/70"}`}
            aria-selected={tab === t.id}
          >
            {t.label}
            {tab === t.id && <motion.div layoutId="journal-tab" className="absolute inset-x-2 bottom-0 h-px bg-amber-400" />}
          </button>
        ))}
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {tab === "log" && (
            <motion.div key="log" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <div className="rounded-2xl border-2 border-dashed border-white/10 bg-[#0a0a0a] p-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                  <Plus className="h-6 w-6 text-white/60" />
                </div>
                <p className="mt-4 text-sm font-medium text-white">Log first trade to start building your journal.</p>
                <p className="mt-1 text-xs text-white/40">Drop CSV or click to log manually — journal will auto-calculate R, PnL, expectancy.</p>
                <button className="mt-4 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black hover:bg-white/90">Log Trade</button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {["Win Rate", "Avg R", "Expectancy"].map((k) => (
                  <div key={k} className="rounded-xl border border-white/[0.06] bg-[#151515] p-4">
                    <p className="text-[11px] tracking-widest text-white/30">{k.toUpperCase()}</p>
                    <p className="mt-1 font-mono text-sm text-white/60">—</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          {tab === "calendar" && (
            <motion.div key="cal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="rounded-xl border border-white/[0.06] bg-[#151515] p-4">
              <div className="flex items-center gap-2 text-sm text-white/70"><Calendar className="w-4 h-4" /> Calendar</div>
              <div className="mt-3 grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-lg border border-white/[0.04] bg-white/[0.02]" />
                ))}
              </div>
            </motion.div>
          )}
          {tab === "analytics" && (
            <motion.div key="ana" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="rounded-xl border border-white/[0.06] bg-[#151515] p-4">
              <div className="flex items-center gap-2 text-sm"><BarChart3 className="w-4 h-4 text-white/60" /> Analytics</div>
              <p className="mt-2 text-xs text-white/40">Connect trade log to see distribution, streaks, by hour/weekday.</p>
            </motion.div>
          )}
          {tab === "reviews" && (
            <motion.div key="rev" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="rounded-xl border border-white/[0.06] bg-[#151515] p-4">
              <div className="flex items-center gap-2 text-sm"><Star className="w-4 h-4 text-white/60" /> Reviews</div>
              <p className="mt-2 text-xs text-white/40">Weekly reviews will appear after 5 logged trades.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
