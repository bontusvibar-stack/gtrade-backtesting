/**
 * Monte Carlo engine: resamples trade netPnL sequences.
 * Never predicts; only shows distribution of possible outcomes by reordering historical trades.
 */
export interface MonteCarloOptions {
  simulations: number; // e.g. 1000
  seed?: number;
}

export interface MonteCarloResult {
  medianReturn: number;
  bestReturn: number;
  worstReturn: number;
  p5: number;
  p95: number;
  probProfit: number;
  probDrawdownOver20: number;
  runs: number[][];
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  const w = pos - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
}

export function runMonteCarlo(
  tradePnls: number[],
  startingBalance: number,
  opts: MonteCarloOptions = { simulations: 1000 },
): MonteCarloResult {
  const sims = Math.min(Math.max(opts.simulations, 10), 10000);
  const rand = mulberry32(opts.seed ?? 42);
  const runs: number[][] = [];
  const finals: number[] = [];

  let drawdownOver20 = 0;
  let profitable = 0;

  for (let s = 0; s < sims; s++) {
    const perm = shuffle(tradePnls, rand);
    let equity = startingBalance;
    let peak = equity;
    let maxDdPct = 0;
    const curve: number[] = [equity];
    for (const pnl of perm) {
      equity += pnl;
      curve.push(equity);
      if (equity > peak) peak = equity;
      const dd = peak > 0 ? (peak - equity) / peak : 0;
      if (dd > maxDdPct) maxDdPct = dd;
    }
    runs.push(curve);
    finals.push(equity);
    if (equity > startingBalance) profitable++;
    if (maxDdPct > 0.2) drawdownOver20++;
  }

  const sorted = [...finals].sort((a, b) => a - b);
  return {
    medianReturn: quantile(sorted, 0.5),
    bestReturn: Math.max(...finals),
    worstReturn: Math.min(...finals),
    p5: quantile(sorted, 0.05),
    p95: quantile(sorted, 0.95),
    probProfit: finals.length ? profitable / finals.length : 0,
    probDrawdownOver20: finals.length ? drawdownOver20 / finals.length : 0,
    runs,
  };
}
