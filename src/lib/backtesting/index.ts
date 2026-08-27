import type { Strategy } from "./strategy";
import { smaCrossoverStrategy } from "./strategies/sma-crossover";
import { rsiThresholdStrategy } from "./strategies/rsi-threshold";
import { breakoutStrategy } from "./strategies/breakout";
import { longHoldStrategy } from "./strategies/long-hold";

export const DEMO_STRATEGIES: Strategy[] = [
  longHoldStrategy,
  smaCrossoverStrategy,
  rsiThresholdStrategy,
  breakoutStrategy,
];

export function getStrategy(id: string): Strategy | undefined {
  // Check localStorage for custom builder strategy (client-side only)
  if (typeof window !== "undefined" && id.startsWith("custom_builder")) {
    try {
      const raw = localStorage.getItem("gtrade_custom_builder");
      if (raw) {
        const { group } = JSON.parse(raw) as { group: unknown };
        const { createRuleStrategy } = require("@/lib/strategy-builder/engine");
        const rule = { id: "builder", name: "Custom Builder", entry: group as never };
        return createRuleStrategy(rule);
      }
    } catch { /* ignore */ }
  }
  return DEMO_STRATEGIES.find((s) => s.id === id);
}

export function getAllStrategies(): Strategy[] {
  const list = [...DEMO_STRATEGIES];
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("gtrade_custom_builder");
      if (raw) {
        const { name, group } = JSON.parse(raw) as { name: string; group: unknown };
        const { createRuleStrategy } = require("@/lib/strategy-builder/engine");
        const strat = createRuleStrategy({ id: "builder", name, entry: group as never });
        list.unshift({ ...strat, id: "custom_builder", name: `★ ${name}` });
      }
    } catch { /* ignore */ }
  }
  return list;
}

export { smaCrossoverStrategy, rsiThresholdStrategy, breakoutStrategy, longHoldStrategy };
