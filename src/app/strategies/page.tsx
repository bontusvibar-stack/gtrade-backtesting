import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StrategyManager, type StrategyRow } from "@/components/strategies/strategy-manager";

export default async function StrategiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("strategies")
    .select("id, name, description, category, archived, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<StrategyRow[]>();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-xl font-semibold tracking-tight">Strategies</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Create, duplicate, version and archive strategies. Backtests record the strategy
        version used for reproducibility.
      </p>
      <div className="mt-6">
        <StrategyManager initial={data ?? []} />
      </div>
    </div>
  );
}
