import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ComparePicker } from "@/components/compare/compare-picker";

interface Row {
  id: string;
  created_at: string;
  backtest_configs: { symbol: string; timeframe: string }[] | null;
  backtest_results: { net_pnl: number; total_return: number | null; win_rate: number | null; profit_factor: number | null; max_drawdown_pct: number | null; trade_count: number; sharpe: number | null }[] | null;
}

export default async function ComparePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("backtest_runs")
    .select("id, created_at, backtest_configs(symbol, timeframe), backtest_results(net_pnl, total_return, win_rate, profit_factor, max_drawdown_pct, trade_count, sharpe)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<Row[]>();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-xl font-semibold tracking-tight">Compare</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Select two or more saved runs to compare. Do not rank by net profit alone.
      </p>
      <div className="mt-6">
        <ComparePicker rows={data ?? []} />
      </div>
    </div>
  );
}
