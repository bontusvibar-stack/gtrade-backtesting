import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

interface ResultRow {
  id: string;
  created_at: string;
  engine_version: string;
  backtest_configs: { symbol: string; timeframe: string }[] | null;
  backtest_results: {
    net_pnl: number;
    total_return: number | null;
    win_rate: number | null;
    max_drawdown_pct: number | null;
    trade_count: number;
  }[] | null;
}

export default async function ResultsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("backtest_runs")
    .select(
      "id, created_at, engine_version, backtest_configs(symbol, timeframe), backtest_results(net_pnl, total_return, win_rate, max_drawdown_pct, trade_count)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<ResultRow[]>();

  const rows = data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-xl font-semibold tracking-tight">Results</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Results are persisted per-user. Re-run any configuration from its detail page.
      </p>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No saved backtests yet. Run one from the Backtest workspace.
          </p>
          <Link
            href="/backtest"
            className="mt-3 inline-block rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
          >
            Open Backtest
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Symbol / TF</th>
                <th className="px-3 py-2 font-medium">Net P&L</th>
                <th className="px-3 py-2 font-medium">Return</th>
                <th className="px-3 py-2 font-medium">Win Rate</th>
                <th className="px-3 py-2 font-medium">DD %</th>
                <th className="px-3 py-2 font-medium">Trades</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs tabular-nums">
              {rows.map((r) => {
                const cfg = r.backtest_configs?.[0] ?? null;
                const res = r.backtest_results?.[0] ?? null;
                const win = (res?.net_pnl ?? 0) >= 0;
                return (
                  <tr key={r.id} className="border-b border-border/40 last:border-0">
                    <td className="px-3 py-2 text-muted-foreground">
                      {new Date(r.created_at).toISOString().slice(0, 16).replace("T", " ")}
                    </td>
                    <td className="px-3 py-2">
                      {cfg ? `${cfg.symbol} ${cfg.timeframe}` : "—"}
                    </td>
                    <td className={`px-3 py-2 font-semibold ${win ? "text-chart-1" : "text-loss"}`}>
                      {res ? Number(res.net_pnl).toLocaleString() : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {res?.total_return !== null && res?.total_return !== undefined
                        ? `${Number(res.total_return).toFixed(2)}%`
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {res?.win_rate !== null && res?.win_rate !== undefined
                        ? `${Number(res.win_rate).toFixed(1)}%`
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {res?.max_drawdown_pct !== null && res?.max_drawdown_pct !== undefined
                        ? `${Number(res.max_drawdown_pct).toFixed(1)}%`
                        : "—"}
                    </td>
                    <td className="px-3 py-2">{res?.trade_count ?? "—"}</td>
                    <td className="px-3 py-2">
                      <Link href={`/results/${r.id}`} className="text-primary underline">
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
