import { ema } from "./ema";

export interface MacdResult {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
}

export function macd(
  values: number[],
  fast = 12,
  slow = 26,
  signalPeriod = 9,
): MacdResult {
  const emaFast = ema(values, fast);
  const emaSlow = ema(values, slow);
  const macdLine: (number | null)[] = values.map((_, i) =>
    emaFast[i] !== null && emaSlow[i] !== null
      ? (emaFast[i] as number) - (emaSlow[i] as number)
      : null,
  );

  const macdVals: number[] = [];
  const idxMap: number[] = [];
  macdLine.forEach((v, i) => {
    if (v !== null) {
      macdVals.push(v);
      idxMap.push(i);
    }
  });
  const sig = ema(macdVals, signalPeriod);
  const signalLine: (number | null)[] = new Array(values.length).fill(null);
  sig.forEach((v, j) => {
    signalLine[idxMap[j]] = v;
  });
  const histogram: (number | null)[] = macdLine.map((v, i) =>
    v !== null && signalLine[i] !== null
      ? v - (signalLine[i] as number)
      : null,
  );
  return { macd: macdLine, signal: signalLine, histogram };
}
