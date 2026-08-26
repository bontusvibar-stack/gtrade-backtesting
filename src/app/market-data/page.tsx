import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CsvUpload } from "@/components/market-data/csv-upload";
import { DemoGenerator } from "@/components/market-data/demo-generator";
import type { MarketDataMeta } from "@/lib/market-data/provider";

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
        {!datasets || datasets.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No datasets yet. Import a CSV or generate demo data above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Symbol</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">TF</th>
                  <th className="px-4 py-2 font-medium">Candles</th>
                  <th className="px-4 py-2 font-medium">Range</th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((d) => (
                  <tr key={d.id} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-2 font-medium">
                      {d.is_demo && (
                        <span className="mr-2 rounded bg-warning/20 px-1.5 py-0.5 text-[10px] font-semibold text-warning">
                          DEMO
                        </span>
                      )}
                      {d.symbol}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {d.market_type ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{d.timeframe}</td>
                    <td className="px-4 py-2 tabular-nums">{d.candle_count}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {d.start_time ? new Date(d.start_time).toISOString().slice(0, 10) : "—"}
                      {" → "}
                      {d.end_time ? new Date(d.end_time).toISOString().slice(0, 10) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
