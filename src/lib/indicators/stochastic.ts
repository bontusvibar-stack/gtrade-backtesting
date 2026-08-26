import { ema } from "./ema";

export interface StochasticResult {
  k: (number | null)[];
  d: (number | null)[];
}

export function stochastic(
  candles: { high: number; low: number; close: number }[],
  kPeriod = 14,
  dPeriod = 3,
): StochasticResult {
  const k: (number | null)[] = new Array(candles.length).fill(null);
  for (let i = 0; i < candles.length; i++) {
    if (i < kPeriod - 1) continue;
    let hh = -Infinity;
    let ll = Infinity;
    for (let j = i - kPeriod + 1; j <= i; j++) {
      hh = Math.max(hh, candles[j].high);
      ll = Math.min(ll, candles[j].low);
    }
    if (hh === ll) {
      k[i] = 50;
      continue;
    }
    k[i] = ((candles[i].close - ll) / (hh - ll)) * 100;
  }
  const kVals: number[] = [];
  const idxMap: number[] = [];
  k.forEach((v, i) => {
    if (v !== null) {
      kVals.push(v);
      idxMap.push(i);
    }
  });
  const dSmooth = ema(kVals, dPeriod);
  const d: (number | null)[] = new Array(candles.length).fill(null);
  dSmooth.forEach((v, j) => {
    d[idxMap[j]] = v;
  });
  return { k, d };
}
