import type { MetricsResult } from "@/lib/calculations/metrics";

function fmt(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return n > 0 ? "∞" : "0";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "profit" | "loss";
}) {
  const color =
    tone === "profit" ? "text-chart-1" : tone === "loss" ? "text-loss" : "";
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 font-mono text-sm font-semibold tabular-nums ${color}`}>
        {value}
      </p>
    </div>
  );
}

export function MetricsPanel({ m }: { m: MetricsResult }) {
  const pnlTone = m.netProfit >= 0 ? "profit" : "loss";
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      <Metric label="Net P&L" value={fmt(m.netProfit)} tone={pnlTone} />
      <Metric label="Return %" value={`${fmt(m.totalReturn)}%`} tone={pnlTone} />
      <Metric label="Win Rate" value={`${fmt(m.winRate, 1)}%`} />
      <Metric
        label="Profit Factor"
        value={fmt(m.profitFactor)}
        tone={m.profitFactor >= 1 ? "profit" : "loss"}
      />
      <Metric label="Expectancy" value={fmt(m.expectancy)} tone={pnlTone} />
      <Metric label="Avg R" value={fmt(m.averageR)} tone={m.averageR >= 0 ? "profit" : "loss"} />
      <Metric
        label="Max DD"
        value={fmt(m.maxDrawdown)}
        tone={m.maxDrawdown > 0 ? "loss" : undefined}
      />
      <Metric label="Max DD %" value={`${fmt(m.maxDrawdownPct, 1)}%`} />
      <Metric label="Trades" value={String(m.tradeCount)} />
      <Metric label="Wins / Losses" value={`${m.winningTrades} / ${m.losingTrades}`} />
      <Metric label="Recovery Factor" value={fmt(m.recoveryFactor)} />
      <Metric label="Sharpe" value={fmt(m.sharpe)} />
      <Metric label="Sortino" value={fmt(m.sortino)} />
      <Metric label="Avg Win" value={fmt(m.averageWin)} tone="profit" />
      <Metric label="Avg Loss" value={fmt(-m.averageLoss)} tone="loss" />
      <Metric label="End Balance" value={fmt(m.endingBalance)} />
    </div>
  );
}
