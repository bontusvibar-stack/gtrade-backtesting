export function wma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  const denom = (period * (period + 1)) / 2;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      out.push(null);
      continue;
    }
    let wsum = 0;
    for (let j = 0; j < period; j++) {
      wsum += values[i - period + 1 + j] * (j + 1);
    }
    out.push(wsum / denom);
  }
  return out;
}
