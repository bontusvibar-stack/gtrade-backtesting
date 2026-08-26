"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateDemoCandles, DEMO_SYMBOLS } from "@/lib/market-data/demo";

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"];

export function DemoGenerator() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onGenerate(symbol: string, timeframe: string) {
    setError(null);
    setStatus(null);
    setBusy(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      setError("Not signed in.");
      return;
    }
    const candles = generateDemoCandles(symbol, timeframe, 1000);
    const { error } = await supabase.from("market_data_sets").insert({
      user_id: user.id,
      symbol,
      market_type: "demo",
      timeframe,
      candle_count: candles.length,
      start_time: new Date(candles[0].timestamp).toISOString(),
      end_time: new Date(candles[candles.length - 1].timestamp).toISOString(),
      is_demo: true,
      metadata: { candles, source: "demo" },
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStatus(`Generated 1000 DEMO candles for ${symbol} ${timeframe}.`);
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-semibold">Generate Demo Data</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Deterministic synthetic candles. Clearly labeled DEMO — never real market
        performance.
      </p>
      <div className="mt-3 space-y-2">
        {DEMO_SYMBOLS.map((sym) => (
          <div key={sym} className="flex flex-wrap items-center gap-2">
            <span className="w-20 text-xs font-medium">{sym}</span>
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                disabled={busy}
                onClick={() => onGenerate(sym, tf)}
                className="rounded border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
              >
                {tf}
              </button>
            ))}
          </div>
        ))}
      </div>
      {busy && <p className="mt-2 text-xs text-muted-foreground">Generating…</p>}
      {status && <p className="mt-2 text-xs text-chart-1">{status}</p>}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
