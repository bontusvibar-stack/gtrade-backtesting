import type { Candle } from "@/types/backtesting";
import {
  SUPPORTED_TIMEFRAMES,
  type MarketDataMeta,
  type MarketDataProvider,
} from "./provider";

/**
 * Deterministic pseudo-random walk (mulberry32). Same seed => same series.
 * Produces DEMO data only — never represents real market performance.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DEMO_SYMBOLS = ["DEMOUSD", "DEMOEUR", "DEMOBTC"] as const;

function seedFor(symbol: string): number {
  let h = 2166136261;
  for (let i = 0; i < symbol.length; i++) {
    h ^= symbol.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function generateDemoCandles(
  symbol: string,
  timeframe: string,
  count: number,
  endTime: number = Date.now(),
): Candle[] {
  const tf = SUPPORTED_TIMEFRAMES.find((t) => t.id === timeframe);
  const step = tf?.ms ?? 3_600_000;
  const rand = mulberry32(seedFor(symbol));
  const base = symbol.includes("BTC") ? 30000 : symbol.includes("EUR") ? 1.1 : 2000;

  const candles: Candle[] = [];
  let price = base;
  const startTime = endTime - (count - 1) * step;
  for (let i = 0; i < count; i++) {
    const drift = (rand() - 0.5) * base * 0.01;
    const open = price;
    const close = Math.max(base * 0.5, open + drift);
    const high = Math.max(open, close) + rand() * base * 0.005;
    const low = Math.min(open, close) - rand() * base * 0.005;
    const volume = Math.floor(100 + rand() * 1000);
    candles.push({
      timestamp: startTime + i * step,
      open: Number(open.toFixed(6)),
      high: Number(high.toFixed(6)),
      low: Number(Math.max(0.000001, low).toFixed(6)),
      close: Number(close.toFixed(6)),
      volume,
    });
    price = close;
  }
  return candles;
}

export function createDemoProvider(): MarketDataProvider {
  return {
    id: "demo",
    async getSymbols() {
      return [...DEMO_SYMBOLS];
    },
    getTimeframes() {
      return SUPPORTED_TIMEFRAMES;
    },
    async getHistoricalCandles(symbol, timeframe, start?, end?) {
      const count = 1000;
      const endTime = end ?? Date.now();
      const candles = generateDemoCandles(symbol, timeframe, count, endTime);
      const filtered = start
        ? candles.filter((c) => c.timestamp >= start)
        : candles;
      const meta: MarketDataMeta = {
        symbol,
        marketType: "demo",
        timeframe,
        candleCount: filtered.length,
        startTime: filtered[0]?.timestamp ?? 0,
        endTime: filtered[filtered.length - 1]?.timestamp ?? 0,
        isDemo: true,
      };
      return { candles: filtered, meta };
    },
  };
}
