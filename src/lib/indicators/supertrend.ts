import { atr } from "./atr";

export interface SupertrendResult {
  supertrend: (number | null)[];
  direction: (number | null)[]; // 1 = bullish, -1 = bearish
}

export function supertrend(
  candles: { high: number; low: number; close: number }[],
  period = 10,
  multiplier = 3,
): SupertrendResult {
  const n = candles.length;
  const out: (number | null)[] = new Array(n).fill(null);
  const dir: (number | null)[] = new Array(n).fill(null);
  if (n < period + 1) return { supertrend: out, direction: dir };

  const atrVals = atr(candles, period);
  let prevUpper = 0;
  let prevLower = 0;
  let prevSupertrend = 0;
  let prevDir = 1;

  for (let i = 0; i < n; i++) {
    if (atrVals[i] === null) continue;
    const atrV = atrVals[i] as number;
    const hl2 = (candles[i].high + candles[i].low) / 2;
    const basicUpper = hl2 + multiplier * atrV;
    const basicLower = hl2 - multiplier * atrV;

    let finalUpper = basicUpper;
    let finalLower = basicLower;

    if (i > 0 && atrVals[i - 1] !== null) {
      // Upper band only moves down, lower only moves up
      if (prevUpper !== 0 && basicUpper > prevUpper && candles[i - 1].close <= prevUpper) {
        finalUpper = prevUpper;
      }
      if (prevLower !== 0 && basicLower < prevLower && candles[i - 1].close >= prevLower) {
        finalLower = prevLower;
      }
    }

    let direction = prevDir;
    if (prevSupertrend !== 0) {
      if (candles[i].close <= finalUpper && prevDir === 1 && candles[i].close < prevSupertrend) {
        // Check if close crossed below supertrend
        if (prevSupertrend === prevUpper) direction = -1;
      }
      if (candles[i].close >= finalLower && prevDir === -1 && candles[i].close > prevSupertrend) {
        if (prevSupertrend === prevLower) direction = 1;
      }
      // Simplified: supertrend is upper when bearish, lower when bullish
      if (direction === 1) {
        if (candles[i].close <= finalUpper && prevDir === 1) {
          // stay bullish unless close < finalUpper previous supertrend
          if (candles[i].close < prevSupertrend && prevSupertrend === prevUpper) direction = -1;
        }
      }
    }

    // Standard simplified logic: if close > prev supertrend then bullish else bearish
    if (prevSupertrend !== 0) {
      if (direction === 1 && candles[i].close < finalUpper && candles[i].close <= prevSupertrend) {
        // keep
      }
    }
    // More robust: use basic crossover of close vs bands
    if (i > 0 && out[i - 1] !== null) {
      if (candles[i].close > out[i - 1]! && dir[i - 1] === -1) direction = 1;
      if (candles[i].close < out[i - 1]! && dir[i - 1] === 1) direction = -1;
    }

    const st = direction === 1 ? finalLower : finalUpper;
    out[i] = st;
    dir[i] = direction;
    prevUpper = finalUpper;
    prevLower = finalLower;
    prevSupertrend = st;
    prevDir = direction;
  }

  return { supertrend: out, direction: dir };
}
