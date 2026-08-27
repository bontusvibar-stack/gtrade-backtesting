import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Trade, EquityPoint } from "@/types/backtesting";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: run } = await supabase
    .from("backtest_runs")
    .select("id, created_at, engine_version, backtest_configs(*), backtest_results(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!run) notFound();

  const cfg = run.backtest_configs?.[0] ?? null;
  const metrics = (run.backtest_results?.[0] as Record<string, unknown> | null)?.metrics as
    | Record<string, unknown>
    | undefined;

  const { data: trades } = await supabase
    .from("trades")
    .select("*")
    .eq("backtest_run_id", id)
    .order("entry_time");

  const { data: equity } = await supabase
    .from("equity_points")
    .select("*")
    .eq("backtest_run_id", id)
    .order("timestamp");

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-8">
      <div className="flex items-center gap-3">
        <Link href="/results" className="text-sm text-muted-foreground hover:text-foreground">
          ← Results
        </Link>
        <h1 className="text-lg font-semibold">Backtest {id.slice(0, 8)}</h1>
        <span className="text-xs text-muted-foreground">
          {new Date(run.created_at).toISOString().slice(0, 16).replace("T", " ")} · engine{" "}
          {run.engine_version}
        </span>
      </div>

      {cfg && (
        <div className="rounded-lg border border-border bg-card p-3 text-sm">
          <p className="text-muted-foreground">
            {cfg.symbol} {cfg.timeframe} · Starting balance {cfg.starting_balance}{" "}
            {cfg.currency}
          </p>
          {metrics && (
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
              <span>Net P&L {(metrics.netProfit as number)?.toLocaleString?.() ?? "—"}</span>
              <span>Return {(metrics.totalReturn as number)?.toFixed?.(2) ?? "—"}%</span>
              <span>Win Rate {(metrics.winRate as number)?.toFixed?.(1) ?? "—"}%</span>
              <span>Trades {String((metrics.tradeCount as number) ?? "—")}</span>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-3 py-2 text-sm font-semibold">
          Trades ({trades?.length ?? 0})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-2 py-2 font-medium">ID</th>
                <th className="px-2 py-2 font-medium">Side</th>
                <th className="px-2 py-2 font-medium">Entry</th>
                <th className="px-2 py-2 font-medium">Exit</th>
                <th className="px-2 py-2 font-medium">Qty</th>
                <th className="px-2 py-2 font-medium">Net</th>
                <th className="px-2 py-2 font-medium">R</th>
                <th className="px-2 py-2 font-medium">Exit Reason</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {(trades ?? []).map((t: Record<string, unknown>) => (
                <tr key={String(t.id)} className="border-b border-border/40 last:border-0">
                  <td className="px-2 py-1.5">{String(t.id).slice(0, 8)}</td>
                  <td
                    className={
                      t.side === "buy" ? "text-chart-1" : "text-loss"
                    }
                  >
                    {String(t.side)}
                  </td>
                  <td className="px-2 py-1.5">{String(t.entry_price)}</td>
                  <td className="px-2 py-1.5">{String(t.exit_price ?? "—")}</td>
                  <td className="px-2 py-1.5">{String(t.quantity)}</td>
                  <td
                    className={`font-semibold ${Number(t.net_pnl) >= 0 ? "text-chart-1" : "text-loss"}`}
                  >
                    {String(t.net_pnl)}
                  </td>
                  <td className="px-2 py-1.5">{String(t.r_multiple ?? "—")}</td>
                  <td className="px-2 py-1.5 text-muted-foreground">
                    {String(t.exit_reason ?? "—")}
                  </td>
                </tr>
              ))}
              {(!trades || trades.length === 0) && (
                <tr>
                  <td colSpan={8} className="px-2 py-6 text-center text-muted-foreground">
                    No trades.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <details className="rounded-lg border border-border bg-card p-3">
        <summary className="cursor-pointer text-sm font-semibold">Configuration (single source of truth)</summary>
        <pre className="mt-2 overflow-auto rounded bg-black/40 p-3 text-xs">{JSON.stringify(cfg, null, 2)}</pre>
      </details>

      <details className="rounded-lg border border-border bg-card p-3">
        <summary className="cursor-pointer text-sm font-semibold">Logs / Warnings</summary>
        <div className="mt-2 text-xs">
          {((run.backtest_results?.[0] as Record<string, unknown>)?.warnings as string[] | undefined)?.length ? (
            ((run.backtest_results?.[0] as Record<string, unknown>).warnings as string[]).map((w, i) => <p key={i} className="text-amber-300">• {w}</p>)
          ) : (
            <p className="text-muted-foreground">No warnings. Historical backtesting does not guarantee future performance.</p>
          )}
        </div>
      </details>

      <details className="rounded-lg border border-border bg-card p-3">
        <summary className="cursor-pointer text-sm font-semibold">Equity points</summary>
        <div className="mt-2 max-h-64 overflow-auto text-xs font-mono">
          {(equity ?? [])
            .slice(0, 20)
            .map((p: Record<string, unknown>) => (
              <div key={String(p.id)} className="flex gap-4 text-muted-foreground">
                <span>{String(p.timestamp).slice(0, 16)}</span>
                <span>equity {String(p.equity)}</span>
                <span>dd {String(p.drawdown_pct)}%</span>
              </div>
            ))}
          {(equity?.length ?? 0) > 20 && (
            <p className="text-muted-foreground">…{equity!.length} total (sampled on save)</p>
          )}
        </div>
      </details>

      <div className="flex gap-2">
        <a href={`/api/export/${id}`} className="rounded-md border border-border px-3 py-1.5 text-xs">Export JSON</a>
        <span className="text-xs text-muted-foreground">Use workspace JSON/CSV export for full trade ledger.</span>
      </div>
    </div>
  );
}
