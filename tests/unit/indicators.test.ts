import { describe, it, expect } from "vitest";
import { sma } from "@/lib/indicators/sma";
import { ema } from "@/lib/indicators/ema";
import { rsi } from "@/lib/indicators/rsi";
import { atr } from "@/lib/indicators/atr";

describe("sma", () => {
  it("returns null until period filled", () => {
    const r = sma([1, 2, 3, 4, 5], 3);
    expect(r).toEqual([null, null, 2, 3, 4]);
  });
});

describe("ema", () => {
  it("seeds with SMA then follows recursion", () => {
    const r = ema([1, 2, 3, 4, 5], 3);
    expect(r[0]).toBeNull();
    expect(r[1]).toBeNull();
    expect(r[2]).toBeCloseTo(2, 6);
    expect(r[3]).toBeCloseTo(3, 6);
    expect(r[4]).toBeCloseTo(4, 6);
  });
});

describe("rsi", () => {
  it("is 100 when all gains", () => {
    const r = rsi([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 14);
    expect(r[14]).toBe(100);
  });
  it("is 0 when all losses", () => {
    const r = rsi([15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], 14);
    expect(r[14]).toBe(0);
  });
});

describe("atr", () => {
  it("computes Wilder ATR over period", () => {
    const candles = Array.from({ length: 15 }, () => ({
      high: 110,
      low: 100,
      close: 100,
    }));
    const r = atr(candles, 14);
    expect(r[14]).toBeCloseTo(10, 6);
  });
});
