import { describe, it, expect } from "vitest";
import type { Candle, SymbolSpec, BacktestConfig, ExitReason, Side } from "@/types/backtesting";
import type { Strategy } from "@/lib/backtesting/strategy";
import { runBacktest } from "@/lib/backtesting/engine";
import { smaCrossoverStrategy } from "@/lib/backtesting/strategies/sma-crossover";

const spec: SymbolSpec = {
  symbol: "TEST",
  baseAsset: "T",
  quoteAsset: "USD",
  contractSize: 1,
  tickSize: 0.01,
  tickValue: 1,
  minQuantity: 0.01,
  maxQuantity: 1000,
  quantityStep: 0.01,
  pricePrecision: 2,
  quantityPrecision: 2,
};

function makeConfig(overrides: Partial<BacktestConfig> = {}): BacktestConfig {
  return {
    symbol: "TEST",
    timeframe: "1h",
    startingBalance: 10000,
    currency: "USD",
    risk: { mode: "fixed_lot", fixedLot: 1 },
    execution: {
      spread: 0,
      commissionModel: "flat",
      commissionValue: 0,
      slippage: 0,
      executionModel: "close",
      tpSlCollision: "stop_first",
    },
    strategyId: "sma_crossover",
    strategyVersion: 1,
    strategyParameters: {},
    symbolSpec: spec,
    ...overrides,
  };
}

function makeCandles(prices: number[]): Candle[] {
  return prices.map((p, i) => ({
    timestamp: 1_700_000_000_000 + i * 3_600_000,
    open: p,
    high: p + 2,
    low: p - 2,
    close: p,
    volume: 100,
  }));
}

describe("engine determinism", () => {
  it("same input -> identical output", () => {
    const candles = makeCandles([
      100, 101, 102, 103, 104, 105, 104, 103, 102, 101, 100, 99, 98, 97, 96,
      97, 98, 99, 100, 101, 102, 103, 104, 105, 106,
    ]);
    const cfg = makeConfig();
    const a = runBacktest(cfg, candles, smaCrossoverStrategy);
    const b = runBacktest(cfg, candles, smaCrossoverStrategy);
    expect(JSON.stringify(a.trades)).toBe(JSON.stringify(b.trades));
    expect(JSON.stringify(a.equityPoints)).toBe(JSON.stringify(b.equityPoints));
  });
});

describe("engine TP/SL collision", () => {
  const collisionStrategy: Strategy = {
    id: "col",
    name: "col",
    description: "",
    version: 1,
    parameters: {},
    onCandle(ctx, candle) {
      if (!ctx.hasPosition() && ctx.currentIndex === 2) {
        ctx.open({
          side: "buy" as Side,
          stopLoss: candle.close - 5,
          takeProfit: candle.close + 5,
        });
      }
    },
  };

  function buildCandles(entryClose: number, hitBoth: boolean): Candle[] {
    const base = makeCandles([100, 100, entryClose, entryClose, entryClose]);
    // candle index 3 touches both TP and SL
    base[3] = {
      timestamp: base[3].timestamp,
      open: entryClose,
      high: hitBoth ? entryClose + 5 : entryClose,
      low: hitBoth ? entryClose - 5 : entryClose,
      close: entryClose,
      volume: 100,
    };
    // candle index 4 to allow exit + finalize
    return base;
  }

  it("stop_first -> exits at SL (loss)", () => {
    const cfg = makeConfig({
      execution: {
        spread: 0,
        commissionModel: "flat",
        commissionValue: 0,
        slippage: 0,
        executionModel: "close",
        tpSlCollision: "stop_first",
      },
    });
    const candles = buildCandles(100, true);
    const r = runBacktest(cfg, candles, collisionStrategy);
    expect(r.trades.length).toBe(1);
    expect(r.trades[0].exitReason).toBe("sl" as ExitReason);
    expect(r.trades[0].netPnl).toBeLessThan(0);
  });

  it("limit_first -> exits at TP (profit)", () => {
    const cfg = makeConfig({
      execution: {
        spread: 0,
        commissionModel: "flat",
        commissionValue: 0,
        slippage: 0,
        executionModel: "close",
        tpSlCollision: "limit_first",
      },
    });
    const candles = buildCandles(100, true);
    const r = runBacktest(cfg, candles, collisionStrategy);
    expect(r.trades[0].exitReason).toBe("tp" as ExitReason);
    expect(r.trades[0].netPnl).toBeGreaterThan(0);
  });
});

describe("engine fees", () => {
  it("applies commission and spread to net pnl", () => {
    const cfg = makeConfig({
      risk: { mode: "fixed_lot", fixedLot: 1 },
      execution: {
        spread: 1,
        commissionModel: "flat",
        commissionValue: 2,
        slippage: 0,
        executionModel: "close",
        tpSlCollision: "stop_first",
      },
    });
    // 30 flat candles then rising -> SMA fast crosses above slow -> buy, closes at end_of_data
    const prices: number[] = [];
    for (let i = 0; i < 30; i++) prices.push(100);
    for (let i = 0; i < 10; i++) prices.push(100 + i);
    const candles = makeCandles(prices);
    const r = runBacktest(cfg, candles, smaCrossoverStrategy);
    expect(r.trades.length).toBeGreaterThan(0);
    const t = r.trades[0];
    expect(t.commission).toBe(2);
    // entry filled at close + spread, exit at close - spread => gross < raw price diff
    expect(t.grossPnl).toBeLessThan((t.exitPrice ?? 0) - (t.entryPrice ?? 0) + 2);
    expect(t.netPnl).toBeLessThan(t.grossPnl);
  });
});
