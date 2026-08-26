export function trueRange(
  candles: { high: number; low: number; close: number }[],
): number[] {
  const tr: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      tr.push(candles[0].high - candles[0].low);
      continue;
    }
    const pc = candles[i - 1].close;
    const c = candles[i];
    tr.push(Math.max(c.high - pc, Math.abs(c.high - pc), Math.abs(c.low - pc)));
  }
  return tr;
}

export function atr(
  candles: { high: number; low: number; close: number }[],
  period = 14,
): (number | null)[] {
  const out: (number | null)[] = new Array(candles.length).fill(null);
  const tr = trueRange(candles);
  if (candles.length < period + 1) return out;
  let sum = 0;
  for (let i = 1; i <= period; i++) sum += tr[i];
  let prev = sum / period;
  out[period] = prev;
  for (let i = period + 1; i < candles.length; i++) {
    prev = (prev * (period - 1) + tr[i]) / period;
    out[i] = prev;
  }
  return out;
}
