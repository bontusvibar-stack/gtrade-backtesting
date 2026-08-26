"use client";

import { useState } from "react";

interface Row {
  id: string;
  created_at: string;
  backtest_configs: { symbol: string; timeframe: string }[] | null;
  backtest_results: {
    net_pnl: number;
    total_return: number | null;
    win_rate: number | null;
    profit_factor: number | null;
    max_drawdown_pct: number | null;
    trade_count: number;
    sharpe: number | null;
  }[] | null;
}

function metricRows(rows: Row[]) {
  const selected = rows;
  const cfg = (r: Row) => r.backtest_configs?.[0] ?? null;
  const res = (r: Row) => r.backtest_results?.[0] ?? null;
  return [
    { label: "Symbol / TF", values: selected.map((r) => (cfg(r) ? `${cfg(r)!.symbol} ${cfg(r)!.timeframe}` : "—")) },
    { label: "Net P&L", values: selected.map((r) => String(res(r)?.net_pnl ?? "—")) },
    { label: "Return %", values: selected.map((r) => (res(r)?.total_return !== null ? `${Number(res(r)!.total_return).toFixed(2)}%` : "—")) },
    { label: "Win Rate %", values: selected.map((r) => (res(r)?.win_rate !== null ? `${Number(res(r)!.win_rate).toFixed(1)}%` : "—")) },
    { label: "Profit Factor", values: selected.map((r) => (res(r)?.profit_factor !== null ? Number(res(r)!.profit_factor).toFixed(3) : "—")) },
    { label: "Max DD %", values: selected.map((r) => (res(r)?.max_drawdown_pct !== null ? `${Number(res(r)!.max_drawdown_pct).toFixed(1)}%` : "—")) },
    { label: "Trade Count", values: selected.map((r) => String(res(r)?.trade_count ?? "—")) },
    { label: "Sharpe", values: selected.map((r) => (res(r)?.sharpe !== null ? Number(res(r)!.sharpe).toFixed(3) : "—")) },
  ];
}

export function ComparePicker({ rows }: { rows: Row[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  function toggle(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(0, 4),
    );
  }

  const selected = rows.filter((r) => selectedIds.includes(r.id));
  const mRows = selected.length >= 2 ? metricRows(selected) : [];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-xs text-muted-foreground">
          Select up to 4 runs (picked {selectedIds.length}).
        </p>
        <div className="mt-2 flex flex-col gap-1">
          {rows.length === 0 && (
            <p className="text-sm text-muted-foreground">No saved runs.</p>
          )}
          {rows.map((r) => (
            <label
              key={r.id}
              className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(r.id)}
                onChange={() => toggle(r.id)}
                className="h-3 w-3"
              />
              <span className="font-mono text-xs text-muted-foreground">
                {new Date(r.created_at).toISOString().slice(0, 16).replace("T", " ")}
              </span>
              <span>{r.backtest_configs?.[0]?.symbol ?? "—"}</span>
              <span className="text-muted-foreground">
                {r.backtest_configs?.[0]?.timeframe ?? ""}
              </span>
            </label>
          ))}
        </div>
      </div>

      {selected.length >= 2 && (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Metric</th>
                {selected.map((r) => (
                  <th key={r.id} className="px-3 py-2 font-medium">
                    {r.id.slice(0, 6)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono text-xs tabular-nums">
              {mRows.map((mr) => (
                <tr key={mr.label} className="border-b border-border/40 last:border-0">
                  <td className="px-3 py-1.5 text-muted-foreground">{mr.label}</td>
                  {mr.values.map((v, i) => (
                    <td key={i} className="px-3 py-1.5">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
