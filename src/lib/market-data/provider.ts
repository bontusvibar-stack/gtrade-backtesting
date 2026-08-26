import type { Candle } from "@/types/backtesting";

export interface TimeframeInfo {
  id: string;
  label: string;
  ms: number;
}

export const SUPPORTED_TIMEFRAMES: TimeframeInfo[] = [
  { id: "1m", label: "1 Minute", ms: 60_000 },
  { id: "5m", label: "5 Minutes", ms: 300_000 },
  { id: "15m", label: "15 Minutes", ms: 900_000 },
  { id: "1h", label: "1 Hour", ms: 3_600_000 },
  { id: "4h", label: "4 Hours", ms: 14_400_000 },
  { id: "1d", label: "1 Day", ms: 86_400_000 },
];

export interface MarketDataMeta {
  symbol: string;
  marketType: string;
  timeframe: string;
  candleCount: number;
  startTime: number;
  endTime: number;
  isDemo: boolean;
}

export interface MarketDataProvider {
  readonly id: string;
  getSymbols(): Promise<string[]>;
  getTimeframes(): TimeframeInfo[];
  getHistoricalCandles(
    symbol: string,
    timeframe: string,
    start?: number,
    end?: number,
  ): Promise<{ candles: Candle[]; meta: MarketDataMeta }>;
}
