"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface DatasetRow {
  id: string;
  symbol: string;
  market_type: string | null;
  timeframe: string;
  candle_count: number;
  start_time: string | null;
  end_time: string | null;
  is_demo: boolean;
}

export function DatasetTable({ datasets }: { datasets: DatasetRow[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onDelete(id: string) {
    if (!confirm("Delete this dataset? This cannot be undone.")) return;
    setDeleting(id);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("market_data_sets").delete().eq("id", id);
    setDeleting(null);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  if (!datasets || datasets.length === 0) {
    return <p className="px-4 py-6 text-sm text-muted-foreground">No datasets yet. Import a CSV or generate demo data above.</p>;
  }

  return (
    <div className="overflow-x-auto">
      {error && <p className="px-4 py-2 text-xs text-destructive">{error}</p>}
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-medium">Symbol</th>
            <th className="px-4 py-2 font-medium">Type</th>
            <th className="px-4 py-2 font-medium">TF</th>
            <th className="px-4 py-2 font-medium">Candles</th>
            <th className="px-4 py-2 font-medium">Range</th>
            <th className="px-4 py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {datasets.map((d) => (
            <tr key={d.id} className="border-b border-border/50 last:border-0">
              <td className="px-4 py-2 font-medium">
                {d.is_demo && <span className="mr-2 rounded bg-warning/20 px-1.5 py-0.5 text-[10px] font-semibold text-warning">DEMO</span>}
                {d.symbol}
              </td>
              <td className="px-4 py-2 text-muted-foreground">{d.market_type ?? "—"}</td>
              <td className="px-4 py-2 text-muted-foreground">{d.timeframe}</td>
              <td className="px-4 py-2 tabular-nums">{d.candle_count}</td>
              <td className="px-4 py-2 text-xs text-muted-foreground">
                {d.start_time ? new Date(d.start_time).toISOString().slice(0, 10) : "—"} → {d.end_time ? new Date(d.end_time).toISOString().slice(0, 10) : "—"}
              </td>
              <td className="px-4 py-2">
                <button onClick={() => onDelete(d.id)} disabled={deleting === d.id} className="text-xs text-destructive hover:underline disabled:opacity-50">
                  {deleting === d.id ? "Deleting…" : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
