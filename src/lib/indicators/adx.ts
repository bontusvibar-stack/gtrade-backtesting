export interface AdxResult {
  adx: (number | null)[];
  plusDI: (number | null)[];
  minusDI: (number | null)[];
}

export function adx(
  candles: { high: number; low: number; close: number }[],
  period = 14,
): AdxResult {
  const n = candles.length;
  const plusDM = new Array(n).fill(0);
  const minusDM = new Array(n).fill(0);
  const trArr = new Array(n).fill(0);
  for (let i = 1; i < n; i++) {
    const up = candles[i].high - candles[i - 1].high;
    const down = candles[i - 1].low - candles[i].low;
    plusDM[i] = up > down && up > 0 ? up : 0;
    minusDM[i] = down > up && down > 0 ? down : 0;
    const pc = candles[i - 1].close;
    trArr[i] = Math.max(
      candles[i].high - pc,
      Math.abs(candles[i].high - pc),
      Math.abs(candles[i].low - pc),
    );
  }

  let trS = 0;
  let pdmS = 0;
  let mdmS = 0;
  let started = false;
  const dx: (number | null)[] = new Array(n).fill(null);
  const plusDI: (number | null)[] = new Array(n).fill(null);
  const minusDI: (number | null)[] = new Array(n).fill(null);
  for (let i = 1; i < n; i++) {
    if (i <= period) {
      trS += trArr[i];
      pdmS += plusDM[i];
      mdmS += minusDM[i];
      if (i === period) {
        trS /= period;
        pdmS /= period;
        mdmS /= period;
        started = true;
      }
      continue;
    }
    trS = (trS * (period - 1) + trArr[i]) / period;
    pdmS = (pdmS * (period - 1) + plusDM[i]) / period;
    mdmS = (mdmS * (period - 1) + minusDM[i]) / period;
    if (!started) continue;
    const pdi = (pdmS / trS) * 100;
    const mdi = (mdmS / trS) * 100;
    plusDI[i] = pdi;
    minusDI[i] = mdi;
    dx[i] = pdi + mdi === 0 ? 0 : (Math.abs(pdi - mdi) / (pdi + mdi)) * 100;
  }

  const adxArr: (number | null)[] = new Array(n).fill(null);
  let adxS = 0;
  let count = 0;
  for (let i = 0; i < n; i++) {
    if (dx[i] === null) continue;
    if (count < period) {
      adxS += dx[i] as number;
      count++;
      if (count === period) {
        adxS /= period;
        adxArr[i] = adxS;
      }
    } else {
      adxS = (adxS * (period - 1) + (dx[i] as number)) / period;
      adxArr[i] = adxS;
    }
  }
  return { adx: adxArr, plusDI, minusDI };
}
