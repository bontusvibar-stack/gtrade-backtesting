import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CsvUpload } from "@/components/market-data/csv-upload";
import { DemoGenerator } from "@/components/market-data/demo-generator";
import { DatasetTable } from "@/components/market-data/dataset-table";

interface DatasetRow {
  id: string;
  symbol: string;
  market_type: string | null;
  timeframe: string;
  candle_count: number;
  start_time: string | null;
  end_time: string | null;
  is_demo: boolean;
  created_at: string;
}

export default async function MarketDataPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: datasets } = await supabase
    .from("market_data_sets")
    .select(
      "id, symbol, market_type, timeframe, candle_count, start_time, end_time, is_demo, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<DatasetRow[]>();

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Market Data</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Import, validate and manage historical candle datasets.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CsvUpload />
        <DemoGenerator />
      </div>

      <div className="rounded-lg border border-border bg-card">
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">
          Your datasets
        </h2>
        <DatasetTable datasets={datasets ?? []} />
      </div>
    </div>
  );
}
