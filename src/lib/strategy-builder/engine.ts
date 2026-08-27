import type { Candle } from "@/types/backtesting";
import * as Indicators from "@/lib/indicators";
import type { Condition, ConditionGroup, StrategyRule } from "./types";
import { isGroup } from "./types";

function getOperandValue(
  candles: Candle[],
  idx: number,
  operand: { type: string; ref: string; param?: number },
  cache: Map<string, (number | null)[]>,
): number | null {
  if (operand.type === "value") {
    const v = Number(operand.ref);
    return Number.isFinite(v) ? v : null;
  }
  if (operand.type === "price") {
    const c = candles[idx];
    if (!c) return null;
    if (operand.ref === "open") return c.open;
    if (operand.ref === "high") return c.high;
    if (operand.ref === "low") return c.low;
    if (operand.ref === "close") return c.close;
    return null;
  }
  if (operand.type === "indicator") {
    const key = `${operand.ref}_${operand.param ?? "default"}`;
    const series = cache.get(key);
    if (!series) return null;
    return series[idx] ?? null;
  }
  return null;
}

function buildCache(candles: Candle[]): Map<string, (number | null)[]> {
  const cache = new Map<string, (number | null)[]>();
  const closes = candles.map((c) => c.close);
  const add = (k: string, v: (number | null)[]) => cache.set(k, v);
  add("SMA_20", Indicators.sma(closes, 20));
  add("SMA_50", Indicators.sma(closes, 50));
  add("EMA_20", Indicators.ema(closes, 20));
  add("EMA_50", Indicators.ema(closes, 50));
  add("RSI_14", Indicators.rsi(closes, 14));
  add("WMA_20", Indicators.wma(closes, 20));
  add("VWAP_default", Indicators.vwap(candles));
  add("ATR_14", Indicators.atr(candles, 14));
  add("CCI_20", Indicators.cci(candles, 20));
  add("ROC_9", Indicators.roc(closes, 9));
  add("Momentum_10", Indicators.momentum(closes, 10));
  add("PSAR_default", Indicators.psar(candles));
  const bb = Indicators.bollinger(closes, 20, 2);
  add("BB_upper", bb.upper);
  add("BB_lower", bb.lower);
  const macd = Indicators.macd(closes);
  add("MACD_default", macd.macd);
  const stoch = Indicators.stochastic(candles);
  add("Stoch_K", stoch.k);
  const adx = Indicators.adx(candles);
  add("ADX_default", adx.adx);
  const st = Indicators.supertrend(candles);
  add("Supertrend_default", st.supertrend);
  return cache;
}

function evalCondition(
  candles: Candle[],
  idx: number,
  cond: Condition,
  cache: Map<string, (number | null)[]>,
): boolean {
  const left = getOperandValue(candles, idx, cond.left, cache);
  const right = getOperandValue(candles, idx, cond.right, cache);
  if (left === null || right === null) return false;
  let res = false;
  switch (cond.operator) {
    case ">": res = left > right; break;
    case "<": res = left < right; break;
    case ">=": res = left >= right; break;
    case "<=": res = left <= right; break;
    case "==": res = left === right; break;
    case "cross_above": {
      const lp = getOperandValue(candles, idx - 1, cond.left, cache);
      const rp = getOperandValue(candles, idx - 1, cond.right, cache);
      if (lp === null || rp === null) res = false;
      else res = lp <= rp && left > right;
      break;
    }
    case "cross_below": {
      const lp = getOperandValue(candles, idx - 1, cond.left, cache);
      const rp = getOperandValue(candles, idx - 1, cond.right, cache);
      if (lp === null || rp === null) res = false;
      else res = lp >= rp && left < right;
      break;
    }
  }
  return cond.not ? !res : res;
}

function evalGroup(
  candles: Candle[],
  idx: number,
  group: ConditionGroup,
  cache: Map<string, (number | null)[]>,
): boolean {
  if (group.conditions.length === 0) return false;
  const results = group.conditions.map((c) => (isGroup(c) ? evalGroup(candles, idx, c, cache) : evalCondition(candles, idx, c, cache)));
  return group.logic === "AND" ? results.every(Boolean) : results.some(Boolean);
}

export function evaluateRule(
  candles: Candle[],
  idx: number,
  rule: StrategyRule,
  cache?: Map<string, (number | null)[]>,
): { entry: boolean; exit: boolean } {
  const c = cache ?? buildCache(candles);
  return {
    entry: evalGroup(candles, idx, rule.entry, c),
    exit: rule.exit ? evalGroup(candles, idx, rule.exit, c) : false,
  };
}

export function createRuleStrategy(rule: StrategyRule) {
  return {
    id: `custom_${rule.id}`,
    name: rule.name,
    description: `Custom: ${rule.entry.conditions.length} entry conditions`,
    version: 1,
    parameters: {},
    onCandle(ctx: { currentIndex: number; candles: Candle[]; hasPosition: () => boolean; open: (p: { side: "buy" | "sell" }) => void; close: (r: string) => void }, _candle: Candle) {
      const cache = buildCache(ctx.candles);
      const { entry, exit } = evaluateRule(ctx.candles, ctx.currentIndex, rule, cache);
      if (!ctx.hasPosition() && entry) ctx.open({ side: "buy" });
      else if (ctx.hasPosition() && exit) ctx.close("signal" as never);
    },
  };
}
