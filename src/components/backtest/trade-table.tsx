"use client";

import { useMemo, useState } from "react";
import type { Trade } from "@/types/backtesting";

const PAGE_SIZE = 50;

type SortKey =
  | "id"
  | "netPnl"
  | "grossPnl"
  | "rMultiple"
  | "durationMs"
  | "entryTime";

function fmt(n: number | null, digits = 2): string {
  if (n === null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function fmtTime(ms: number | null): string {
  if (ms === null) return "—";
  return new Date(ms).toISOString().replace("T", " ").slice(0, 16);
}

export function TradeTable({ trades }: { trades: Trade[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [asc, setAsc] = useState(true);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? trades.filter(
          (t) =>
            t.id.toLowerCase().includes(q) ||
            t.side.includes(q) ||
            (t.exitReason ?? "").toLowerCase().includes(q),
        )
      : trades;
    const sorted = [...base].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (typeof av === "string" || typeof bv === "string") {
        return asc
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      }
      return asc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return sorted;
  }, [trades, sortKey, asc, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  function header(key: SortKey, label: string) {
    return (
      <th
        className="cursor-pointer px-2 py-2 font-medium select-none hover:text-foreground"
        onClick={() => {
          if (sortKey === key) setAsc(!asc);
          else {
            setSortKey(key);
            setAsc(true);
          }
        }}
      >
        {label}
        {sortKey === key ? (asc ? " ↑" : " ↓") : ""}
      </th>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h3 className="text-sm font-semibold">
          Trades{" "}
          <span className="text-xs font-normal text-muted-foreground">
            ({filtered.length})
          </span>
        </h3>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder="Search id / side / exit…"
          className="w-48 rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              {header("id", "ID")}
              <th className="px-2 py-2 font-medium">Side</th>
              {header("entryTime", "Entry Time")}
              <th className="px-2 py-2 font-medium">Exit Time</th>
              <th className="px-2 py-2 font-medium">Entry</th>
              <th className="px-2 py-2 font-medium">Exit</th>
              <th className="px-2 py-2 font-medium">Size</th>
              <th className="px-2 py-2 font-medium">SL</th>
              <th className="px-2 py-2 font-medium">TP</th>
              <th className="px-2 py-2 font-medium">Gross</th>
              <th className="px-2 py-2 font-medium">Fees</th>
              {header("netPnl", "Net")}
              {header("rMultiple", "R")}
              {header("durationMs", "Duration")}
              <th className="px-2 py-2 font-medium">Exit Reason</th>
            </tr>
          </thead>
          <tbody className="font-mono tabular-nums">
            {rows.map((t) => (
              <tr key={t.id} className="border-b border-border/40 last:border-0">
                <td className="px-2 py-1.5">{t.id}</td>
                <td
                  className={`px-2 py-1.5 font-medium ${
                    t.side === "buy" ? "text-chart-1" : "text-loss"
                  }`}
                >
                  {t.side}
                </td>
                <td className="px-2 py-1.5 text-muted-foreground">
                  {fmtTime(t.entryTime)}
                </td>
                <td className="px-2 py-1.5 text-muted-foreground">
                  {fmtTime(t.exitTime)}
                </td>
                <td className="px-2 py-1.5">{fmt(t.entryPrice, 4)}</td>
                <td className="px-2 py-1.5">{fmt(t.exitPrice, 4)}</td>
                <td className="px-2 py-1.5">{fmt(t.quantity, 2)}</td>
                <td className="px-2 py-1.5 text-muted-foreground">
                  {fmt(t.stopLoss, 4)}
                </td>
                <td className="px-2 py-1.5 text-muted-foreground">
                  {fmt(t.takeProfit, 4)}
                </td>
                <td className="px-2 py-1.5">{fmt(t.grossPnl)}</td>
                <td className="px-2 py-1.5 text-muted-foreground">
                  {fmt(t.commission + t.slippage)}
                </td>
                <td
                  className={`px-2 py-1.5 font-semibold ${
                    t.netPnl >= 0 ? "text-chart-1" : "text-loss"
                  }`}
                >
                  {fmt(t.netPnl)}
                </td>
                <td className="px-2 py-1.5">{fmt(t.rMultiple)}</td>
                <td className="px-2 py-1.5 text-muted-foreground">
                  {t.durationMs !== null
                    ? `${Math.round(t.durationMs / 60000)}m`
                    : "—"}
                </td>
                <td className="px-2 py-1.5 text-muted-foreground">
                  {t.exitReason ?? "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={15} className="px-2 py-6 text-center text-muted-foreground">
                  No trades.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted-foreground">
          <span>
            Page {safePage + 1} of {pageCount}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(0, safePage - 1))}
              disabled={safePage === 0}
              className="rounded border border-border px-2 py-1 hover:bg-accent disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
              disabled={safePage >= pageCount - 1}
              className="rounded border border-border px-2 py-1 hover:bg-accent disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
