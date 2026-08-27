"use client";

import type { BacktestConfig, Candle } from "@/types/backtesting";
import type { RunResult } from "./engine";

export function canUseWorker(): boolean {
  return typeof window !== "undefined" && typeof Worker !== "undefined";
}

export async function runBacktestInWorker(
  config: BacktestConfig,
  candles: Candle[],
): Promise<RunResult> {
  if (!canUseWorker() || candles.length < 5000) {
    const { runBacktest } = await import("./engine");
    const { getStrategy } = await import("./index");
    const strat = getStrategy(config.strategyId);
    if (!strat) throw new Error("Strategy not found");
    return runBacktest(config, candles, strat);
  }

  return new Promise<RunResult>((resolve, reject) => {
    const worker = new Worker(new URL("@/workers/backtest.worker.ts", import.meta.url));
    const id = Math.random().toString(36).slice(2);
    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error("Worker timeout"));
    }, 30000);

    worker.onmessage = (e: MessageEvent<{ id: string; ok: boolean; result?: RunResult; error?: string }>) => {
      if (e.data.id !== id) return;
      clearTimeout(timeout);
      worker.terminate();
      if (e.data.ok && e.data.result) resolve(e.data.result as RunResult);
      else reject(new Error(e.data.error ?? "Worker failed"));
    };
    worker.onerror = (ev) => {
      clearTimeout(timeout);
      worker.terminate();
      reject(new Error(ev.message));
    };
    worker.postMessage({ id, config, candles });
  });
}
