import type { Candle } from "@/types/backtesting";

export interface WalkForwardWindow {
  trainStart: number;
  trainEnd: number;
  testStart: number;
  testEnd: number;
  trainCandles: Candle[];
  testCandles: Candle[];
}

/**
 * Generate rolling walk-forward windows.
 * Example: train 12M, test 3M rolling.
 */
export function walkForwardWindows(
  candles: Candle[],
  trainSize: number,
  testSize: number,
  step: number = testSize,
): WalkForwardWindow[] {
  const sorted = [...candles].sort((a, b) => a.timestamp - b.timestamp);
  const windows: WalkForwardWindow[] = [];
  for (let start = 0; start + trainSize + testSize <= sorted.length; start += step) {
    const train = sorted.slice(start, start + trainSize);
    const test = sorted.slice(start + trainSize, start + trainSize + testSize);
    windows.push({
      trainStart: train[0].timestamp,
      trainEnd: train[train.length - 1].timestamp,
      testStart: test[0].timestamp,
      testEnd: test[test.length - 1].timestamp,
      trainCandles: train,
      testCandles: test,
    });
  }
  return windows;
}

export function splitInOutSample(
  candles: Candle[],
  inSampleRatio = 0.7,
): { inSample: Candle[]; outSample: Candle[] } {
  const sorted = [...candles].sort((a, b) => a.timestamp - b.timestamp);
  const splitAt = Math.floor(sorted.length * inSampleRatio);
  return { inSample: sorted.slice(0, splitAt), outSample: sorted.slice(splitAt) };
}
