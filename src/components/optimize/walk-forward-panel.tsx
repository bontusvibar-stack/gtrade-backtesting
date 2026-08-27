"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Candle } from "@/types/backtesting";
import { splitInOutSample, walkForwardWindows } from "@/lib/calculations/walk-forward";

interface DatasetOpt {
  id: string;
  symbol: string;
  timeframe: string;
  candle_count: number;
  is_demo: boolean;
}

export function WalkForwardPanel({ datasets }: { datasets: DatasetOpt[] }) {
  const [datasetId, setDatasetId] = useState(datasets[0]?.id ?? "");
  const [summary, setSummary] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function onAnalyze() {
    setError(null);
    setSummary("");
    const supabase = createClient();
    const { data, error: e } = await supabase
      .from("market_data_sets")
      .select("metadata")
      .eq("id", datasetId)
      .single<{ metadata: { candles?: Candle[] } }>();
    if (e) {
      setError(e.message);
      return;
    }
    const candles = data.metadata?.candles ?? [];
    if (candles.length < 100) {
      setError("Need at least 100 candles for walk-forward split.");
      return;
    }
    const split = splitInOutSample(candles, 0.7);
    const train = Math.max(30, Math.floor(candles.length * 0.5));
    const test = Math.max(10, Math.floor(candles.length * 0.15));
    const windows = walkForwardWindows(candles, train, test);
    setSummary(`IS ${split.inSample.length} candles, OOS ${split.outSample.length} candles, rolling windows ${windows.length} (train ${train}, test ${test}).`);
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-semibold">Walk-Forward / Out-of-Sample</h2>
      <p className="text-xs text-muted-foreground">Splits dataset into in-sample and out-of-sample; rolling windows prepared for optimization runs.</p>
      <div className="flex flex-wrap gap-2">
        <select value={datasetId} onChange={(e) => setDatasetId(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1.5 text-sm">
          {datasets.map((d) => <option key={d.id} value={d.id}>{d.is_demo ? "[DEMO] " : ""}{d.symbol} {d.timeframe} ({d.candle_count})</option>)}
        </select>
        <button onClick={onAnalyze} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Analyze Split</button>
      </div>
      {summary && <p className="text-xs text-chart-1">{summary}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
