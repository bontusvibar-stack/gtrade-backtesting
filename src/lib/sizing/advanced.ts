import type { Candle } from "@/types/backtesting";
import { atr } from "@/lib/indicators/atr";
import { pipValueToPrice, atrBasedLevels } from "@/lib/calculations/pnl";

export type SlTpMode = "fixed" | "percent" | "atr" | "pips" | "risk";

export function resolveStopTake(
  entry: number,
  side: "buy" | "sell",
  mode: SlTpMode,
  value: number,
  candles: Candle[],
  idx: number,
  atrPeriod = 14,
  pipSize = 0.0001,
): { stopLoss: number | null; takeProfit: number | null } {
  if (mode === "fixed") {
    return side === "buy" ? { stopLoss: entry - value, takeProfit: entry + value } : { stopLoss: entry + value, takeProfit: entry - value };
  }
  if (mode === "percent") {
    const pct = value / 100;
    return side === "buy" ? { stopLoss: entry * (1 - pct), takeProfit: entry * (1 + pct) } : { stopLoss: entry * (1 + pct), takeProfit: entry * (1 - pct) };
  }
  if (mode === "pips") {
    const dist = pipValueToPrice(value, pipSize);
    return side === "buy" ? { stopLoss: entry - dist, takeProfit: entry + dist } : { stopLoss: entry + dist, takeProfit: entry - dist };
  }
  if (mode === "atr") {
    const slice = candles.slice(Math.max(0, idx - atrPeriod), idx + 1);
    const vals = atr(slice, atrPeriod);
    const a = vals[vals.length - 1] ?? 0;
    if (!a) return { stopLoss: null, takeProfit: null };
    const { stopLoss, takeProfit } = atrBasedLevels(entry, a, side, value, value * 2);
    return { stopLoss, takeProfit };
  }
  // risk-based: value is R multiple, handled via position sizing elsewhere
  return { stopLoss: null, takeProfit: null };
}
