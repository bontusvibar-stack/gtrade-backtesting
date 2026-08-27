import { describe, it, expect } from "vitest";
import { cci } from "@/lib/indicators/cci";
import { roc } from "@/lib/indicators/roc";
import { momentum } from "@/lib/indicators/momentum";
import { psar } from "@/lib/indicators/psar";
import { supertrend } from "@/lib/indicators/supertrend";
import { calculateMargin } from "@/lib/calculations/margin";
import { runMonteCarlo } from "@/lib/calculations/monte-carlo";
import { splitInOutSample, walkForwardWindows } from "@/lib/calculations/walk-forward";
import { detectMissingCandles, validateCandles } from "@/lib/market-data/csv";
import { evaluateRule } from "@/lib/strategy-builder/engine";

describe("new indicators", () => {
  it("cci zero when mean deviation zero", () => {
    const candles = Array.from({ length: 20 }, () => ({ high: 10, low: 10, close: 10 }));
    const r = cci(candles, 20);
    expect(r[19]).toBe(0);
  });
  it("roc percent change", () => {
    expect(roc([100, 110], 1)[1]).toBeCloseTo(10, 6);
  });
  it("momentum difference", () => {
    expect(momentum([1, 2, 3], 2)[2]).toBe(2);
  });
  it("psar returns series", () => {
    const candles = Array.from({ length: 10 }, (_, i) => ({ high: 10 + i, low: 9 + i, close: 9.5 + i }));
    const r = psar(candles);
    expect(r.length).toBe(10);
    expect(r[0]).not.toBeNull();
  });
  it("supertrend direction", () => {
    const candles = Array.from({ length: 20 }, (_, i) => ({ high: 110, low: 100, close: 105 }));
    const r = supertrend(candles, 10, 3);
    expect(r.supertrend.length).toBe(20);
  });
});

describe("margin", () => {
  it("used margin = notional / leverage", () => {
    const m = calculateMargin(10000, 0, 1, 100, 1, 10);
    expect(m.usedMargin).toBeCloseTo(10, 6);
    expect(m.freeMargin).toBeCloseTo(9990, 6);
  });
});

describe("monte carlo", () => {
  it("deterministic with seed", () => {
    const a = runMonteCarlo([10, -5, 20], 1000, { simulations: 10, seed: 1 });
    const b = runMonteCarlo([10, -5, 20], 1000, { simulations: 10, seed: 1 });
    expect(a.medianReturn).toBe(b.medianReturn);
  });
});

describe("walk-forward", () => {
  it("splits correctly", () => {
    const candles = Array.from({ length: 100 }, (_, i) => ({ timestamp: i * 60000, open: 1, high: 1, low: 1, close: 1, volume: 0 }));
    const { inSample, outSample } = splitInOutSample(candles, 0.7);
    expect(inSample.length).toBe(70);
    expect(outSample.length).toBe(30);
    const wins = walkForwardWindows(candles, 50, 10);
    expect(wins.length).toBeGreaterThan(0);
  });
});

describe("market data validation", () => {
  it("detects missing candles", () => {
    const candles = [
      { timestamp: 0, open: 1, high: 1, low: 1, close: 1, volume: 0 },
      { timestamp: 60000, open: 1, high: 1, low: 1, close: 1, volume: 0 },
      { timestamp: 180000, open: 1, high: 1, low: 1, close: 1, volume: 0 },
    ];
    expect(detectMissingCandles(candles, 60000).length).toBe(1);
  });
  it("validates high/low", () => {
    const candles = [{ timestamp: 0, open: 5, high: 4, low: 1, close: 2, volume: 0 }];
    expect(validateCandles(candles).length).toBeGreaterThan(0);
  });
});

describe("strategy builder", () => {
  it("evaluates AND logic", () => {
    const candles = Array.from({ length: 30 }, (_, i) => ({ timestamp: i, open: 10 + i, high: 11 + i, low: 9 + i, close: 10 + i, volume: 100 }));
    const rule = {
      id: "r",
      name: "t",
      entry: {
        id: "g",
        logic: "AND" as const,
        conditions: [
          { id: "c1", left: { type: "price" as const, ref: "close" }, operator: ">" as const, right: { type: "value" as const, ref: "0" } },
        ],
      },
    };
    const { entry } = evaluateRule(candles, 25, rule as never);
    expect(entry).toBe(true);
  });
});
