"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspaceStore } from "@/store/workspace";
import { Search, Command, BarChart3, Brain, Beaker } from "lucide-react";

const ACTIONS = [
  { id: "backtest", label: "Run Backtest", keywords: "analyze backtest", href: "/backtest", icon: <Beaker className="w-4 h-4" /> },
  { id: "compare", label: "Compare Sessions", keywords: "compare", href: "/compare", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "monte", label: "Run Monte Carlo", keywords: "monte carlo", href: "/monte-carlo", icon: <Brain className="w-4 h-4" /> },
  { id: "analytics", label: "Open Analytics", keywords: "analytics", href: "/analytics", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "optimize", label: "Optimize Parameters", keywords: "optimize", href: "/optimize", icon: <Search className="w-4 h-4" /> },
];

export function CommandBar() {
  const { commandBarOpen, setCommandBarOpen, setAIStatus, addAIActivity } = useWorkspaceStore();
  const [q, setQ] = useState("");
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandBarOpen(!useWorkspaceStore.getState().commandBarOpen);
      }
      if (e.key === "Escape") setCommandBarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setCommandBarOpen]);

  const filtered = q.trim() === "" ? ACTIONS : ACTIONS.filter(a => a.label.toLowerCase().includes(q.toLowerCase()) || a.keywords.includes(q.toLowerCase()));

  const run = (href: string, label: string) => {
    setCommandBarOpen(false);
    setQ("");
    addAIActivity({ action: `Command: ${label}`, status: "completed" });
    setAIStatus("analyzing");
    setTimeout(() => setAIStatus("ready"), 800);
    router.push(href);
  };

  return (
    <AnimatePresence>
      {commandBarOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm" onClick={() => setCommandBarOpen(false)} />
          <motion.div initial={{ opacity: 0, y: -20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }} className="fixed left-1/2 top-[22%] z-[91] w-[min(640px,92vw)] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#0f0f0f] shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <Command className="w-4 h-4 text-white/40" />
              <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Ask GTrade Agent..." className="flex-1 bg-transparent text-sm text-white placeholder-white/40 outline-none" />
              <span className="text-[10px] tracking-widest text-white/30">ESC</span>
            </div>
            <div className="max-h-[320px] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-white/40">No actions</p>
              ) : filtered.map(a => (
                <button key={a.id} onClick={() => run(a.href, a.label)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-white/[0.06]">
                  <span className="text-emerald-400/70">{a.icon}</span>
                  <span className="text-sm text-white/80">{a.label}</span>
                  <span className="ml-auto text-xs text-white/30">{a.href}</span>
                </button>
              ))}
            </div>
            <div className="border-t border-white/10 px-4 py-2 text-[11px] text-white/30">Try: “Analyze my last backtest” · “Show largest drawdown” · “Run Monte Carlo”</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
