import type { Candle, Side } from "@/types/backtesting";
import type { Strategy, StrategyContext } from "../strategy";
import { rsi } from "@/lib/indicators";

export const rsiThresholdStrategy: Strategy = {
  id: "rsi_threshold",
  name: "RSI Threshold",
  description:
    "Buys when RSI crosses below oversold; exits when RSI crosses above overbought. Demo strategy — not a profitable system.",
  version: 1,
  parameters: { period: 14, oversold: 30, overbought: 70 },
  onCandle(ctx: StrategyContext, _candle: Candle) {
    const period = Number(ctx.config.strategyParameters.period ?? this.parameters.period);
    const oversold = Number(ctx.config.strategyParameters.oversold ?? this.parameters.oversold);
    const overbought = Number(
      ctx.config.strategyParameters.overbought ?? this.parameters.overbought,
    );
    const closes = ctx.candles.slice(0, ctx.currentIndex + 1).map((c) => c.close);
    const line = rsi(closes, period);
    const i = line.length - 1;
    if (i < 1 || line[i] === null || line[i - 1] === null) return;

    const crossedUp = line[i - 1]! <= oversold && line[i]! > oversold;
    const crossedDown = line[i - 1]! >= overbought && line[i]! < overbought;

    if (!ctx.hasPosition() && crossedUp) {
      ctx.open({ side: "buy" as Side });
    } else if (ctx.hasPosition() && crossedDown) {
      ctx.close("signal");
    }
  },
};
