export function psar(
  candles: { high: number; low: number; close: number }[],
  step = 0.02,
  maxStep = 0.2,
): (number | null)[] {
  const n = candles.length;
  const out: (number | null)[] = new Array(n).fill(null);
  if (n < 2) return out;

  let isLong = true;
  let af = step;
  let ep = candles[0].high;
  let sar = candles[0].low;

  out[0] = sar;

  for (let i = 1; i < n; i++) {
    const prevSar = sar;

    // Calculate next SAR
    sar = prevSar + af * (ep - prevSar);

    // Clamp SAR within previous two bars extremes
    if (isLong) {
      const low1 = candles[i - 1].low;
      const low2 = i >= 2 ? candles[i - 2].low : low1;
      sar = Math.min(sar, low1, low2);
    } else {
      const high1 = candles[i - 1].high;
      const high2 = i >= 2 ? candles[i - 2].high : high1;
      sar = Math.max(sar, high1, high2);
    }

    // Check reversal
    let reversal = false;
    if (isLong) {
      if (candles[i].low < sar) {
        reversal = true;
        isLong = false;
        sar = ep; // previous EP becomes SAR
        ep = candles[i].low;
        af = step;
      } else {
        if (candles[i].high > ep) {
          ep = candles[i].high;
          af = Math.min(af + step, maxStep);
        }
      }
    } else {
      if (candles[i].high > sar) {
        reversal = true;
        isLong = true;
        sar = ep;
        ep = candles[i].high;
        af = step;
      } else {
        if (candles[i].low < ep) {
          ep = candles[i].low;
          af = Math.min(af + step, maxStep);
        }
      }
    }

    out[i] = sar;

    // The reversal SAR was set to prior EP, already assigned
    if (reversal) {
      // keep af reset handled above
    }
  }

  return out;
}
