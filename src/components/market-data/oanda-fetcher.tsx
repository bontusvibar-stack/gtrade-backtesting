"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createOandaProvider } from "@/lib/market-data/oanda";

const OANDA_SYMBOLS = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "NZDUSD", "EURJPY", "GBPJPY", "BTCUSD", "ETHUSD"];
const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"];

export function OandaFetcher() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  async function onFetch(symbol: string, timeframe: string) {
    if (!token.trim()) {
      setError("Enter OANDA API token first.");
      return;
    }
    setError(null);
    setStatus(null);
    setBusy(true);
    try {
      const provider = createOandaProvider(token.trim());
      const result = await provider.getHistoricalCandles(symbol, timeframe);
      
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      const candles = result.candles;
      const { error } = await supabase.from("market_data_sets").insert({
        user_id: user.id,
        symbol: result.meta.symbol,
        market_type: "forex",
        timeframe: result.meta.timeframe,
        candle_count: candles.length,
        start_time: new Date(result.meta.startTime).toISOString(),
        end_time: new Date(result.meta.endTime).toISOString(),
        is_demo: false,
        metadata: { candles, source: "oanda" },
      });
      if (error) throw new Error(error.message);

      setStatus(`Fetched ${candles.length} candles from OANDA for ${symbol} ${timeframe}. Saved to DB.`);
      setSavedCount(c => c + 1);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fetch failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-semibold">Fetch from OANDA (Real Market Data)</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Requires OANDA API token (practice account). Fetches real forex/crypto candles.
      </p>
      <div className="mt-3 space-y-2">
        <input
          type="password"
          placeholder="OANDA API Token (Personal Access Token)"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <div className="mt-3 space-y-2">
          {OANDA_SYMBOLS.map((sym) => (
            <div key={sym} className="flex flex-wrap items-center gap-2">
              <span className="w-20 text-xs font-medium text-emerald-300">{sym}</span>
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  disabled={busy || !token.trim()}
                  onClick={() => onFetch(sym, tf)}
                  className="rounded border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                >
                  {tf}
                </button>
              ))}
            </div>
          ))}
        </div>
        {busy && <p className="mt-2 text-xs text-muted-foreground">Fetching from OANDA…</p>}
        {status && <p className="mt-2 text-xs text-chart-1">{status}</p>}
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        {savedCount > 0 && <p className="mt-2 text-xs text-emerald-300">Total datasets saved: {savedCount}</p>}
      </div>
    </div>
  );
}