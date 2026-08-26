import type { Candle, Side } from "@/types/backtesting";
import type { Strategy, StrategyContext } from "../strategy";

export const longHoldStrategy: Strategy = {
  id: "long_hold",
  name: "Long & Hold (Test)",
  description:
    "Opens a long on the first actionable candle and holds to end. Intended for testing entry, execution, fees, and P&L wiring.",
  version: 1,
  parameters: {},
  onCandle(ctx: StrategyContext, _candle: Candle) {
    if (!ctx.hasPosition()) {
      ctx.open({ side: "buy" as Side });
    }
  },
};
