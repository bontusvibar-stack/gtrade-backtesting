import type { Candle, Side } from "@/types/backtesting";
import type { Strategy, StrategyContext } from "../strategy";
import { sma } from "@/lib/indicators";

export const smaCrossoverStrategy: Strategy = {
  id: "sma_crossover",
  name: "SMA Crossover",
  description:
    "Buys when fast SMA crosses above slow SMA; exits on opposite cross. Demo strategy — not a profitable system.",
  version: 1,
  parameters: { fast: 10, slow: 30 },
  onCandle(ctx: StrategyContext, _candle: Candle) {
    const fast = Number(ctx.config.strategyParameters.fast ?? this.parameters.fast);
    const slow = Number(ctx.config.strategyParameters.slow ?? this.parameters.slow);
    const closes = ctx.candles.slice(0, ctx.currentIndex + 1).map((c) => c.close);
    const fastLine = sma(closes, fast);
    const slowLine = sma(closes, slow);
    if (fastLine.length < 2 || slowLine.length < 2) return;
    const i = fastLine.length - 1;
    const fPrev = fastLine[i - 1];
    const sPrev = slowLine[i - 1];
    const fCur = fastLine[i];
    const sCur = slowLine[i];
    if (fPrev === null || sPrev === null || fCur === null || sCur === null) return;

    const bullishCross = fPrev <= sPrev && fCur > sCur;
    const bearishCross = fPrev >= sPrev && fCur < sCur;

    if (!ctx.hasPosition() && bullishCross) {
      ctx.open({ side: "buy" as Side });
    } else if (ctx.hasPosition() && bearishCross) {
      ctx.close("signal");
    }
  },
};
