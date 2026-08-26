import type { Strategy } from "./strategy";
import { smaCrossoverStrategy } from "./strategies/sma-crossover";
import { rsiThresholdStrategy } from "./strategies/rsi-threshold";
import { breakoutStrategy } from "./strategies/breakout";

export const DEMO_STRATEGIES: Strategy[] = [
  smaCrossoverStrategy,
  rsiThresholdStrategy,
  breakoutStrategy,
];

export function getStrategy(id: string): Strategy | undefined {
  return DEMO_STRATEGIES.find((s) => s.id === id);
}

export { smaCrossoverStrategy, rsiThresholdStrategy, breakoutStrategy };
