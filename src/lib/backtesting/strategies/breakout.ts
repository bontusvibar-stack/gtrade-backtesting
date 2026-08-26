import type { Candle, Side } from "@/types/backtesting";
import type { Strategy, StrategyContext } from "../strategy";

export const breakoutStrategy: Strategy = {
  id: "breakout",
  name: "Breakout",
  description:
    "Buys when close exceeds the highest high of the lookback window; exits on reverse breakout. Demo strategy — not a profitable system.",
  version: 1,
  parameters: { lookback: 20 },
  onCandle(ctx: StrategyContext, candle: Candle) {
    const lookback = Number(
      ctx.config.strategyParameters.lookback ?? this.parameters.lookback,
    );
    if (ctx.currentIndex < lookback) return;
    const window = ctx.candles.slice(
      ctx.currentIndex - lookback,
      ctx.currentIndex,
    );
    const highest = Math.max(...window.map((c) => c.high));
    const lowest = Math.min(...window.map((c) => c.low));

    if (!ctx.hasPosition() && candle.close > highest) {
      ctx.open({ side: "buy" as Side });
    } else if (ctx.hasPosition() && candle.close < lowest) {
      ctx.close("signal");
    }
  },
};
