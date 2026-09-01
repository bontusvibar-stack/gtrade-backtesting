import { createClient } from "@/lib/supabase/server";
import { TradeJournal } from "@/components/journal/TradeJournal";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

export default async function JournalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let signals: never[] = [];
  let trades: never[] = [];
  if (user) {
    const { data: s } = await supabase.from("trading_signals").select("id,symbol,action,entry_price,strategy,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
    signals = (s ?? []) as never[];
    const { data: t } = await supabase.from("journal_trades").select("id,symbol,direction,entry_price,result,pnl,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    trades = (t ?? []) as never[];
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-sm font-bold tracking-widest text-white">TRADE JOURNAL</h1>
        <p className="text-xs text-white/40">Log · Calendar · Analytics · Reviews + Signals → Journal → Screenshots (Supabase Storage)</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/[0.06] bg-[#151515] p-4">
          <h2 className="text-xs font-semibold tracking-widest text-white/60">RECENT SIGNALS</h2>
          <div className="mt-3 space-y-2 text-xs">
            {(signals as unknown as { symbol: string; action: string; entry_price: number; strategy: string | null }[]).length === 0 ? <p className="text-white/30">No signals</p> : (signals as unknown as { symbol: string; action: string; entry_price: number; strategy: string | null }[]).map((s, i) => <div key={i} className="flex justify-between rounded bg-white/[0.04] px-2 py-1.5"><span>{s.symbol} {s.action}</span><span>{s.strategy ?? ""}</span><span className="font-mono">{Number(s.entry_price).toFixed(2)}</span></div>)}
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-[#151515] p-4">
          <h2 className="text-xs font-semibold tracking-widest text-white/60">JOURNAL TRADES</h2>
          <div className="mt-3 space-y-2 text-xs">
            {(trades as unknown as { symbol: string; direction: string; entry_price: number; result: string | null }[]).length === 0 ? <p className="text-white/30">No journal trades. Convert a signal → trade.</p> : (trades as unknown as { symbol: string; direction: string; entry_price: number; result: string | null }[]).map((t, i) => <div key={i} className="flex justify-between rounded bg-white/[0.04] px-2 py-1.5"><span>{t.symbol} {t.direction}</span><span className={t.result === "WIN" ? "text-emerald-400" : t.result === "LOSS" ? "text-red-400" : "text-white/50"}>{t.result ?? "OPEN"}</span><span className="font-mono">{Number(t.entry_price).toFixed(2)}</span></div>)}
          </div>
        </div>
      </div>
      <TradeJournal />
      <p className="text-xs text-white/30">Screenshots: Supabase Storage bucket `trade-screenshots` — entry/during/exit per trade. Not blob.</p>
    </div>
  );
}
