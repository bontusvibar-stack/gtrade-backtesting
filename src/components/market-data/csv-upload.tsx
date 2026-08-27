"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseCsv } from "@/lib/market-data/csv";
import { createClient } from "@/lib/supabase/client";

export function CsvUpload() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setErrors([]);
    setStatus(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const result = parseCsv(text);
    if (result.errors.length > 0) {
      setErrors(result.errors.slice(0, 10));
      return;
    }
    if (result.warnings.length > 0) {
      const proceed = confirm(`Warnings:\n${result.warnings.slice(0, 5).join("\n")}\nProceed anyway?`);
      if (!proceed) {
        setErrors(result.warnings.slice(0, 10));
        return;
      }
    }

    const symbol = window.prompt("Symbol for this dataset (e.g. EURUSD):");
    if (!symbol) return;
    const timeframe = window.prompt("Timeframe (1m, 5m, 15m, 1h, 4h, 1d):", "1h");
    if (!timeframe) return;

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setErrors(["Not signed in."]);
      return;
    }

    const candles = result.candles;
    const { error } = await supabase.from("market_data_sets").insert({
      user_id: user.id,
      symbol: symbol.toUpperCase(),
      market_type: "csv",
      timeframe,
      candle_count: candles.length,
      start_time: new Date(candles[0].timestamp).toISOString(),
      end_time: new Date(candles[candles.length - 1].timestamp).toISOString(),
      is_demo: false,
      metadata: { candles, source: "csv", filename: file.name },
    });
    setSaving(false);

    if (error) {
      setErrors([error.message]);
      return;
    }
    setStatus(`Imported ${candles.length} candles.`);
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-semibold">Import CSV</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Required columns: timestamp, open, high, low, close. Optional: volume.
        Invalid datasets are rejected — data is never silently altered.
      </p>
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={onFile}
        disabled={saving}
        className="mt-3 block w-full cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-accent file:px-3 file:py-1 file:text-sm"
      />
      {saving && <p className="mt-2 text-xs text-muted-foreground">Saving…</p>}
      {status && <p className="mt-2 text-xs text-chart-1">{status}</p>}
      {errors.length > 0 && (
        <div className="mt-2 rounded-md border border-destructive/40 bg-destructive/10 p-2">
          <p className="text-xs font-medium text-destructive">
            Validation failed ({errors.length} error{errors.length > 1 ? "s" : ""}):
          </p>
          <ul className="mt-1 list-inside list-disc text-xs text-destructive">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
