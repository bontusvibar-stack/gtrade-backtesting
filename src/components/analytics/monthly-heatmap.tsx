"use client";

interface MonthCell {
  key: string; // YYYY-MM
  pnl: number;
}

export function MonthlyHeatmap({ months }: { months: MonthCell[] }) {
  if (months.length === 0) {
    return <p className="text-sm text-muted-foreground">No monthly data.</p>;
  }
  const maxAbs = Math.max(1, ...months.map((m) => Math.abs(m.pnl)));
  return (
    <div className="grid grid-cols-4 gap-1 sm:grid-cols-6 md:grid-cols-8">
      {months.map((m) => {
        const intensity = Math.min(1, Math.abs(m.pnl) / maxAbs);
        const bg =
          m.pnl > 0
            ? `rgba(34,197,94,${0.15 + 0.45 * intensity})`
            : m.pnl < 0
              ? `rgba(239,68,68,${0.15 + 0.45 * intensity})`
              : "rgba(0,0,0,0)";
        return (
          <div
            key={m.key}
            style={{ background: bg }}
            className="rounded border border-border px-2 py-2 text-center"
          >
            <p className="text-[10px] leading-none text-muted-foreground">{m.key}</p>
            <p className={`mt-1 font-mono text-xs font-semibold tabular-nums ${m.pnl >= 0 ? "text-chart-1" : "text-loss"}`}>
              {m.pnl.toFixed(0)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
