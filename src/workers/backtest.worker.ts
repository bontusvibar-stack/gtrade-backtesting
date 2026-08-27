/// <reference lib="webworker" />
import type { BacktestConfig, Candle } from "@/types/backtesting";
import { runBacktest } from "@/lib/backtesting/engine";
import { getStrategy } from "@/lib/backtesting";

export interface WorkerRequest {
  id: string;
  config: BacktestConfig;
  candles: Candle[];
}

export interface WorkerResponse {
  id: string;
  ok: boolean;
  result?: ReturnType<typeof runBacktest>;
  error?: string;
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, config, candles } = e.data;
  try {
    const strat = getStrategy(config.strategyId);
    if (!strat) throw new Error(`Strategy ${config.strategyId} not found`);
    const result = runBacktest(config, candles, strat);
    const resp: WorkerResponse = { id, ok: true, result };
    (self as unknown as Worker).postMessage(resp);
  } catch (err) {
    const resp: WorkerResponse = { id, ok: false, error: err instanceof Error ? err.message : String(err) };
    (self as unknown as Worker).postMessage(resp);
  }
};

export {};
