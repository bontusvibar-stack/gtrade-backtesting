import { sma } from "./sma";

export interface BollingerResult {
  middle: (number | null)[];
  upper: (number | null)[];
  lower: (number | null)[];
}

export function bollinger(
  values: number[],
  period = 20,
  mult = 2,
): BollingerResult {
  const mid = sma(values, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    const m = mid[i];
    if (m === null) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    let s = 0;
    for (let j = 0; j < period; j++) {
      const d = values[i - period + 1 + j] - m;
      s += d * d;
    }
    const sd = Math.sqrt(s / period);
    upper.push(m + mult * sd);
    lower.push(m - mult * sd);
  }
  return { middle: mid, upper, lower };
}
