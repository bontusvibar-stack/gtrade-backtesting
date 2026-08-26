export interface DrawdownPoint {
  equity: number;
  drawdown: number;
  drawdownPct: number;
}

export interface DrawdownResult {
  curve: DrawdownPoint[];
  maxDrawdown: number;
  maxDrawdownPct: number;
}

export function computeDrawdown(equitySeries: number[]): DrawdownResult {
  const curve: DrawdownPoint[] = [];
  let peak = equitySeries[0] ?? 0;
  let maxDrawdown = 0;
  let maxDrawdownPct = 0;
  for (const e of equitySeries) {
    if (e > peak) peak = e;
    const dd = peak - e;
    const ddPct = peak > 0 ? (dd / peak) * 100 : 0;
    if (dd > maxDrawdown) maxDrawdown = dd;
    if (ddPct > maxDrawdownPct) maxDrawdownPct = ddPct;
    curve.push({ equity: e, drawdown: dd, drawdownPct: ddPct });
  }
  return { curve, maxDrawdown, maxDrawdownPct };
}
