"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = ["CONNECTING", "INITIALIZING ENGINE", "LOADING MARKET DATA", "SYNCING STRATEGIES", "READY"] as const;

export function Connecting({ onReady }: { onReady?: () => void }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (idx >= STEPS.length - 1) {
      const t = setTimeout(() => onReady?.(), 280);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setIdx(i => i + 1), 520);
    return () => clearTimeout(t);
  }, [idx, onReady]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]">
      <div className="text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={STEPS[idx]}
            initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="text-sm font-medium tracking-[0.45em] text-white"
          >
            {STEPS[idx]}
          </motion.p>
        </AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mx-auto mt-6 h-px w-24 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
      </div>
    </div>
  );
}
