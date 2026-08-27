import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ManualReplay } from "@/components/manual/manual-replay";

export default async function ManualPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: datasets } = await supabase
    .from("market_data_sets")
    .select("id, symbol, timeframe, candle_count, is_demo")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-xl font-semibold tracking-tight">Manual Backtesting</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Bar replay mode — future candles hidden. Use play/pause/step to trade manually.
      </p>
      <div className="mt-6">
        <ManualReplay datasets={datasets ?? []} />
      </div>
    </div>
  );
}
