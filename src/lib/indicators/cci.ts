export function cci(
  candles: { high: number; low: number; close: number }[],
  period = 20,
): (number | null)[] {
  const n = candles.length;
  const out: (number | null)[] = new Array(n).fill(null);
  if (n < period) return out;
  const tp: number[] = candles.map((c) => (c.high + c.low + c.close) / 3);
  for (let i = period - 1; i < n; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += tp[j];
    const sma = sum / period;
    let md = 0;
    for (let j = i - period + 1; j <= i; j++) md += Math.abs(tp[j] - sma);
    md /= period;
    if (md === 0) {
      out[i] = 0;
    } else {
      out[i] = (tp[i] - sma) / (0.015 * md);
    }
  }
  return out;
}
