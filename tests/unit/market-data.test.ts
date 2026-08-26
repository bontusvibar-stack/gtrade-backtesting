import { describe, it, expect } from "vitest";
import { parseCsv, validateCandles } from "@/lib/market-data/csv";
import { generateDemoCandles } from "@/lib/market-data/demo";

const validCsv = `timestamp,open,high,low,close,volume
1700000000,100,110,95,105,1000
1700003600,105,112,100,110,1200
1700007200,110,115,105,108,900`;

describe("parseCsv", () => {
  it("parses valid csv", () => {
    const r = parseCsv(validCsv);
    expect(r.errors).toEqual([]);
    expect(r.candles.length).toBe(3);
    expect(r.candles[0].close).toBe(105);
  });

  it("treats epoch seconds as ms", () => {
    const r = parseCsv(validCsv);
    expect(r.candles[0].timestamp).toBe(1700000000 * 1000);
  });

  it("rejects missing columns", () => {
    const r = parseCsv("timestamp,open\n1700000000,1");
    expect(r.errors[0]).toContain("Missing required columns");
    expect(r.candles.length).toBe(0);
  });

  it("rejects empty file", () => {
    const r = parseCsv("");
    expect(r.errors[0]).toContain("empty");
  });

  it("rejects high < low", () => {
    const r = parseCsv(
      "timestamp,open,high,low,close,volume\n1700000000,100,90,95,105,10",
    );
    expect(r.errors.join(" ")).toContain("high");
  });

  it("rejects close outside range", () => {
    const r = parseCsv(
      "timestamp,open,high,low,close,volume\n1700000000,100,110,95,120,10",
    );
    expect(r.errors.join(" ")).toContain("close");
  });

  it("rejects non-increasing timestamps", () => {
    const r = parseCsv(
      "timestamp,open,high,low,close,volume\n1700003600,100,110,95,105,10\n1700000000,100,110,95,105,10",
    );
    expect(r.errors.join(" ")).toContain("increasing");
  });

  it("rejects duplicate timestamps", () => {
    const r = parseCsv(
      "timestamp,open,high,low,close,volume\n1700000000,100,110,95,105,10\n1700000000,100,110,95,105,10",
    );
    expect(r.errors.join(" ")).toContain("duplicate");
  });

  it("rejects non-numeric values", () => {
    const r = parseCsv(
      "timestamp,open,high,low,close,volume\n1700000000,abc,110,95,105,10",
    );
    expect(r.errors.join(" ")).toContain("non-numeric");
  });

  it("warns when volume missing but still parses", () => {
    const r = parseCsv("timestamp,open,high,low,close\n1700000000,100,110,95,105");
    expect(r.warnings.join(" ")).toContain("volume");
    expect(r.candles[0].volume).toBe(0);
  });
});

describe("validateCandles", () => {
  it("accepts clean series", () => {
    const r = parseCsv(validCsv);
    expect(validateCandles(r.candles)).toEqual([]);
  });
});

describe("generateDemoCandles", () => {
  it("is deterministic for same seed", () => {
    const a = generateDemoCandles("DEMOUSD", "1h", 100, 1700000000000);
    const b = generateDemoCandles("DEMOUSD", "1h", 100, 1700000000000);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("produces valid ohlc relationships", () => {
    const candles = generateDemoCandles("DEMOUSD", "1h", 200, 1700000000000);
    expect(validateCandles(candles)).toEqual([]);
  });

  it("different symbols give different series", () => {
    const a = generateDemoCandles("DEMOUSD", "1h", 50, 1700000000000);
    const b = generateDemoCandles("DEMOBTC", "1h", 50, 1700000000000);
    expect(a[0].close).not.toBe(b[0].close);
  });
});
