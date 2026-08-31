import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BacktestPageClient } from "@/components/backtest/BacktestPageClient";
import type { DatasetOption } from "@/components/backtest/backtest-workspace";

interface DatasetRow {
  id: string;
  symbol: string;
  timeframe: string;
  candle_count: number;
  is_demo: boolean;
}

export default async function BacktestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("market_data_sets")
    .select("id, symbol, timeframe, candle_count, is_demo")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<DatasetRow[]>();

  const datasets: DatasetOption[] = (data ?? []).map((d) => ({
    id: d.id,
    symbol: d.symbol,
    timeframe: d.timeframe,
    candleCount: d.candle_count,
    isDemo: d.is_demo,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <BacktestPageClient datasets={datasets} />
    </div>
  );
}
