"use client";
import { motion } from "framer-motion";
import { APP_NAME } from "@/config";

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden bg-gradient-to-b from-background via-background to-muted/20 px-6 text-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-4xl font-bold tracking-tight text-foreground">
        {APP_NAME}
      </motion.h1>
      <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="max-w-md text-sm text-muted-foreground">
        Modern full-stack trading backtesting platform. Run historical trading strategies against market data and analyze performance with professional charts.
      </motion.p>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex gap-3">
        <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} href="/dashboard" className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-lg transition-colors hover:bg-primary/90">
          Open Dashboard →
        </motion.a>
        <motion.a whileHover={{ scale: 1.05 }} href="/market-data" className="rounded-md border border-border bg-card px-6 py-2.5 text-sm font-medium hover:bg-accent">
          Market Data
        </motion.a>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-8 grid grid-cols-3 gap-4 text-xs">
        {["Backtest", "Monte Carlo", "Manual Replay"].map((f, i) => (
          <motion.div key={f} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }} className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="font-medium">{f}</p>
            <p className="text-muted-foreground">Professional</p>
          </motion.div>
        ))}
      </motion.div>
      <p className="text-xs text-muted-foreground/70">Historical backtesting does not guarantee future performance.</p>
    </div>
  );
}
