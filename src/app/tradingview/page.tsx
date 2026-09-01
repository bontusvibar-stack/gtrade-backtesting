import { TradingViewWidget } from "@/components/tradingview/TradingViewWidget";
import { AlertBuilder } from "@/components/tradingview/AlertBuilder";
import { SignalPanel } from "@/components/tradingview/SignalPanel";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export default async function TradingViewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let signals: never[] = [];
  if (user) {
    const { data } = await supabase.from("trading_signals").select("id,symbol,action,entry_price,timeframe,strategy,stop_loss,take_profit,received_at").eq("user_id", user.id).order("received_at", { ascending: false }).limit(20);
    signals = (data ?? []) as never[];
  }
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const webhookUrl = `${proto}://${host}/api/webhooks/tradingview`;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-sm font-bold tracking-widest text-white">TRADINGVIEW INTEGRATION</h1>
        <p className="mt-1 text-xs text-white/40">Flow: Chart → Alert → Webhook → Validation → Supabase → Realtime → Journal/Analytics. No fake data.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-4">
          <TradingViewWidget symbol="OANDA:XAUUSD" interval="15" height={520} />
          <div className="rounded-xl border border-white/[0.06] bg-[#151515] p-3 text-xs leading-relaxed text-white/40">
            <p className="font-medium text-white/70">Abstraction</p>
            <p className="font-mono">MarketDataProvider → getHistoricalData / getQuote — swap OANDA/TradingView/Broker without hard dependency.</p>
            <p className="mt-2">Default: XAUUSD M15 Dark Asia/Jakarta. User can change symbol/timeframe/theme via widget toolbar.</p>
          </div>
        </div>
        <div className="space-y-4 lg:col-span-4">
          <AlertBuilder webhookUrl={webhookUrl} />
          <div>
            <h2 className="mb-2 text-xs font-semibold tracking-widest text-white/60">TRADINGVIEW SIGNALS (REALTIME)</h2>
            <SignalPanel initial={signals as never} />
          </div>
        </div>
      </div>
    </div>
  );
}
