export function vwap(
  candles: { high: number; low: number; close: number; volume: number }[],
): number[] {
  const out: number[] = [];
  let cumPV = 0;
  let cumV = 0;
  for (const c of candles) {
    const tp = (c.high + c.low + c.close) / 3;
    cumPV += tp * c.volume;
    cumV += c.volume;
    out.push(cumV === 0 ? tp : cumPV / cumV);
  }
  return out;
}
