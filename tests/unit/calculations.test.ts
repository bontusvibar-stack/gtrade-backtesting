import { describe, it, expect } from "vitest";
import {
  grossPnl,
  commissionCost,
  rMultiple,
} from "@/lib/calculations/pnl";
import {
  percentRiskPositionSize,
  fixedMoneyPositionSize,
} from "@/lib/calculations/position-sizing";
import { computeDrawdown } from "@/lib/calculations/drawdown";
import { computeMetrics } from "@/lib/calculations/metrics";
import type { MetricsTrade } from "@/lib/calculations/metrics";
import type { Side, ExitReason } from "@/types/backtesting";

describe("grossPnl", () => {
  it("buy profit", () => {
    expect(grossPnl("buy", 100, 110, 2, 1)).toBe(20);
  });
  it("sell profit", () => {
    expect(grossPnl("sell", 110, 100, 2, 1)).toBe(20);
  });
});

describe("commissionCost", () => {
  it("percent", () => {
    expect(commissionCost("percent", 1, 10000, 2)).toBeCloseTo(100, 6);
  });
  it("per_unit", () => {
    expect(commissionCost("per_unit", 0.5, 0, 4)).toBe(2);
  });
  it("flat", () => {
    expect(commissionCost("flat", 5, 0, 0)).toBe(5);
  });
});

describe("rMultiple", () => {
  it("ratios net to risk", () => {
    expect(rMultiple(50, 100)).toBe(0.5);
  });
  it("zero risk -> 0", () => {
    expect(rMultiple(50, 0)).toBe(0);
  });
});

describe("position sizing", () => {
  it("percent risk", () => {
    // equity 10000, risk 1% = 100, stop distance 10 -> qty 10
    expect(percentRiskPositionSize(10000, 1, 100, 90, 1)).toBe(10);
  });
  it("fixed money", () => {
    expect(fixedMoneyPositionSize(100, 100, 90, 1)).toBe(10);
  });
  it("zero distance -> 0", () => {
    expect(percentRiskPositionSize(10000, 1, 100, 100, 1)).toBe(0);
  });
});

describe("computeDrawdown", () => {
  it("tracks peak and max dd", () => {
    const r = computeDrawdown([100, 120, 90, 110]);
    expect(r.maxDrawdown).toBeCloseTo(30, 6);
    expect(r.maxDrawdownPct).toBeCloseTo(25, 6);
  });
});

describe("computeMetrics", () => {
  const trades: MetricsTrade[] = [
    {
      netPnl: 100,
      grossPnl: 110,
      commission: 5,
      slippage: 5,
      rMultiple: 1,
      side: "buy" as Side,
      entryTime: Date.parse("2024-01-01T00:00:00Z"),
      exitTime: Date.parse("2024-01-01T01:00:00Z"),
      exitReason: "tp" as ExitReason,
    },
    {
      netPnl: -50,
      grossPnl: -40,
      commission: 5,
      slippage: 5,
      rMultiple: -0.5,
      side: "buy" as Side,
      entryTime: Date.parse("2024-01-02T00:00:00Z"),
      exitTime: Date.parse("2024-01-02T01:00:00Z"),
      exitReason: "sl" as ExitReason,
    },
  ];
  const m = computeMetrics({
    trades,
    startingBalance: 1000,
    equityCurve: [1000, 1100, 1050],
  });
  it("win/loss counts", () => {
    expect(m.winningTrades).toBe(1);
    expect(m.losingTrades).toBe(1);
    expect(m.tradeCount).toBe(2);
    expect(m.winRate).toBe(50);
  });
  it("profit factor", () => {
    expect(m.profitFactor).toBeCloseTo(100 / 50, 6);
  });
  it("net profit and return", () => {
    expect(m.netProfit).toBe(50);
    expect(m.totalReturn).toBeCloseTo(5, 6);
  });
});
