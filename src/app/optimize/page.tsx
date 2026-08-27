import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Optimizer } from "@/components/optimize/optimizer";
import { WalkForwardPanel } from "@/components/optimize/walk-forward-panel";

export default async function OptimizePage() {
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
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-xl font-semibold tracking-tight">Optimize</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Grid search over strategy parameters with a hard safety limit on combinations.
        High historical performance may indicate overfitting.
      </p>
      <div className="mt-6 rounded-md border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
        <p className="font-semibold">Overfitting warning</p>
        <p className="mt-1">
          More parameters increase overfitting risk. Optimization does not guarantee future
          performance. Distinguish in-sample vs out-of-sample where architecture permits.
        </p>
      </div>
      <div className="mt-4 space-y-4">
        <Optimizer datasets={datasets ?? []} />
        <WalkForwardPanel datasets={datasets ?? []} />
      </div>
    </div>
  );
}
