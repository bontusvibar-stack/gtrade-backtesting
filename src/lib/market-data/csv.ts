import type { Candle } from "@/types/backtesting";

export interface ParseResult {
  candles: Candle[];
  errors: string[];
  warnings: string[];
}

const REQUIRED_COLUMNS = ["timestamp", "open", "high", "low", "close"] as const;
const OPTIONAL_COLUMNS = ["volume"] as const;

function toNumber(raw: string): number {
  return Number(raw);
}

function toTimestamp(raw: string): number | null {
  if (/^\d+$/.test(raw)) {
    const n = Number(raw);
    // Heuristic: seconds vs ms epoch. 1e11 ms ≈ year 5138; below that assume seconds.
    return n < 1e11 ? n * 1000 : n;
  }
  const t = Date.parse(raw);
  return Number.isNaN(t) ? null : t;
}

export function validateCandles(candles: Candle[]): string[] {
  const errors: string[] = [];
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    if (!Number.isFinite(c.open) || !Number.isFinite(c.high) || !Number.isFinite(c.low) || !Number.isFinite(c.close)) {
      errors.push(`Row ${i + 1}: non-numeric OHLC value.`);
      continue;
    }
    if (c.high < c.low) errors.push(`Row ${i + 1}: high (${c.high}) < low (${c.low}).`);
    if (c.close > c.high || c.close < c.low)
      errors.push(`Row ${i + 1}: close (${c.close}) outside high/low range.`);
    if (c.open > c.high || c.open < c.low)
      errors.push(`Row ${i + 1}: open (${c.open}) outside high/low range.`);
    if (c.open <= 0 || c.close <= 0) errors.push(`Row ${i + 1}: non-positive price.`);
    if (c.volume < 0) errors.push(`Row ${i + 1}: negative volume.`);
    if (i > 0 && c.timestamp <= candles[i - 1].timestamp)
      errors.push(`Row ${i + 1}: timestamp not strictly increasing.`);
  }
  return errors;
}

/**
 * Parse raw CSV text into candles.
 * Rejects invalid datasets with useful errors. Never silently alters data.
 */
export function parseCsv(csv: string): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { candles: [], errors: ["File is empty."], warnings };
  }

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length > 0) {
    return {
      candles: [],
      errors: [`Missing required columns: ${missing.join(", ")}.`],
      warnings,
    };
  }

  const idx = (name: string) => header.indexOf(name);
  const tsIdx = idx("timestamp");
  const oIdx = idx("open");
  const hIdx = idx("high");
  const lIdx = idx("low");
  const cIdx = idx("close");
  const vIdx = idx("volume");
  if (vIdx === -1) warnings.push("No volume column; volume defaults to 0.");

  const candles: Candle[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    if (cols.length < header.length) {
      errors.push(`Row ${i + 1}: expected ${header.length} columns, got ${cols.length}.`);
      continue;
    }
    const ts = toTimestamp(cols[tsIdx]);
    if (ts === null) {
      errors.push(`Row ${i + 1}: invalid timestamp "${cols[tsIdx]}".`);
      continue;
    }
    const open = toNumber(cols[oIdx]);
    const high = toNumber(cols[hIdx]);
    const low = toNumber(cols[lIdx]);
    const close = toNumber(cols[cIdx]);
    const volume = vIdx === -1 ? 0 : toNumber(cols[vIdx]);
    if ([open, high, low, close, volume].some((v) => Number.isNaN(v))) {
      errors.push(`Row ${i + 1}: non-numeric OHLCV value.`);
      continue;
    }
    candles.push({ timestamp: ts, open, high, low, close, volume });
  }

  if (candles.length > 0) {
    errors.push(...validateCandles(candles));
  }

  // Detect duplicate timestamps
  const seen = new Set<number>();
  for (let i = 0; i < candles.length; i++) {
    if (seen.has(candles[i].timestamp)) {
      errors.push(`Row ${i + 1}: duplicate timestamp.`);
    }
    seen.add(candles[i].timestamp);
  }

  if (candles.length === 0 && errors.length === 0) {
    errors.push("No valid data rows found.");
  }

  return { candles, errors, warnings };
}
