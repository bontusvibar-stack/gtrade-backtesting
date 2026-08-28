"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { createOandaProvider } from "@/lib/market-data/oanda";
import { generateDemoCandles, DEMO_SYMBOLS } from "@/lib/market-data/demo";
import { Download, Database, Zap, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";

const FOCUS_SYMBOLS = ["NQ100", "XAUUSD", "BTCUSD", "GBPUSD"] as const;
const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;
const SYMBOL_LABELS: Record<string, string> = {
  NQ100: "NASDAQ 100",
  XAUUSD: "Gold (XAU/USD)",
  BTCUSD: "Bitcoin",
  GBPUSD: "GBP/USD",
};

export function DataGenerator() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [source, setSource] = useState<"oanda" | "demo">("oanda");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [lastFetched, setLastFetched] = useState<{ symbol: string; tf: string; count: number } | null>(null);
  const [tokenValid, setTokenValid] = useState<null | boolean>(null);

  // Check token on change
  useEffect(() => {
    if (token.length > 20) {
      setTokenValid(null);
      // Quick validation
      fetch("https://api-fxpractice.oanda.com/v3/accounts", {
        headers: { Authorization: `Bearer ${token.trim()}` },
      }).then(r => setTokenValid(r.ok)).catch(() => setTokenValid(false));
    } else {
      setTokenValid(null);
    }
  }, [token]);

  async function onFetchOanda(symbol: string, timeframe: string) {
    if (!token.trim()) {
      setError("Masukkan OANDA Personal Access Token dulu (practice account).");
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
      if (!user) throw new Error("Belum login.");

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

      setStatus(`✓ OANDA: ${SYMBOL_LABELS[symbol]} ${timeframe} — ${candles.length} candles saved`);
      setLastFetched({ symbol, tf: timeframe, count: candles.length });
      setSavedCount(c => c + 1);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fetch gagal");
    } finally {
      setBusy(false);
    }
  }

  async function onGenerateDemo(symbol: string, timeframe: string) {
    setError(null);
    setStatus(null);
    setBusy(true);
    try {
      const candles = generateDemoCandles(symbol, timeframe, 1000);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Belum login.");

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
      if (error) throw new Error(error.message);

      setStatus(`✓ Demo: ${SYMBOL_LABELS[symbol]} ${timeframe} — ${candles.length} candles generated`);
      setLastFetched({ symbol, tf: timeframe, count: candles.length });
      setSavedCount(c => c + 1);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generate gagal");
    } finally {
      setBusy(false);
    }
  }

  const handleFetch = (symbol: string, tf: string) => {
    if (source === "oanda") onFetchOanda(symbol, tf);
    else onGenerateDemo(symbol, tf);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-emerald-900/30 bg-gradient-to-br from-emerald-950/30 via-[#050a06] to-[#050a06] p-6 overflow-hidden relative"
    >
      {/* Background glow */}
      <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-72 h-72 rounded-full bg-green-500/10 blur-3xl" />

      {/* Header */}
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-emerald-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Market Data Generator
          </h2>
          <p className="text-sm text-white/50 mt-1">Ambil data real dari OANDA atau generate demo deterministic untuk backtest</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSource("oanda")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              source === "oanda"
                ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
            }`}
          >
            <Zap className="w-4 h-4 mr-2 inline" /> OANDA Live
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSource("demo")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              source === "demo"
                ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
            }`}
          >
            <Database className="w-4 h-4 mr-2 inline" /> Demo Data
          </motion.button>
        </div>
      </div>

      {/* Token Input for OANDA */}
      {source === "oanda" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-6"
        >
          <div className="relative">
            <label className="text-xs font-medium text-white/60 mb-1 block">OANDA Personal Access Token (Practice Account)</label>
            <div className="relative">
              <input
                type="password"
                placeholder="Masukkan Personal Access Token dari OANDA Practice Account..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
              />
              {token.length > 10 && tokenValid !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {tokenValid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <span className="w-5 h-5 text-red-500">✕</span>
                  )}
                </motion.div>
              )}
            </div>
            <p className="text-xs text-white/40 mt-2">
              Dapatkan di <a href="https://developer.oanda.com/" target="_blank" rel="noopener" className="text-emerald-400 hover:underline">OANDA Developer Portal</a> → Practice Account → Generate Token
            </p>
            {tokenValid === false && token.length > 10 && (
              <p className="text-xs text-red-400 mt-1">Token tidak valid / expired. Generate ulang di OANDA.</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Symbol Grid - Focus Symbols */}
      <div className="relative">
        <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {source === "oanda" ? "OANDA Live Data (Real Market)" : "Demo Data (Deterministic)"}
          <span className="ml-2 px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/20 text-emerald-300">
            {FOCUS_SYMBOLS.length} Symbols
          </span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FOCUS_SYMBOLS.map((sym) => (
            <motion.div
              key={sym}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * FOCUS_SYMBOLS.indexOf(sym) }}
              className="group relative rounded-xl border border-emerald-900/30 bg-[#0f1410]/50 p-4 hover:border-emerald-700/50 hover:bg-emerald-950/20 transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-900/50 to-green-900/50 flex items-center justify-center">
                    {sym === "NQ100" && <span className="text-lg font-bold text-emerald-400">NQ</span>}
                    {sym === "XAUUSD" && <span className="text-lg font-bold text-yellow-400">AU</span>}
                    {sym === "BTCUSD" && <span className="text-lg font-bold text-orange-400">₿</span>}
                    {sym === "GBPUSD" && <span className="text-lg font-bold text-blue-400">£</span>}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{SYMBOL_LABELS[sym]}</p>
                    <p className="text-[10px] text-white/40 tracking-widest uppercase">
                      {sym === "NQ100" ? "NAS100_USD" :
                       sym === "XAUUSD" ? "XAU_USD" :
                       sym === "BTCUSD" ? "BTC_USD" : "GBP_USD"}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  {source === "oanda" ? "LIVE" : "DEMO"}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-1.5">
                {TIMEFRAMES.map((tf) => (
                  <motion.button
                    key={tf}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={busy || (source === "oanda" && !token.trim())}
                    onClick={() => handleFetch(sym, tf)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      busy
                        ? "bg-white/5 text-white/40 cursor-not-allowed"
                        : source === "oanda" && !token.trim()
                        ? "bg-white/5 text-white/30 border border-white/10 cursor-not-allowed"
                        : "bg-white/5 text-white/70 hover:bg-emerald-500/20 hover:text-emerald-300 border border-white/10"
                    }`}
                  >
                    {tf}
                    {busy && lastFetched?.symbol === sym && lastFetched?.tf === tf && (
                      <Loader2 className="w-3 h-3 ml-1 animate-spin inline" />
                    )}
                  </motion.button>
                ))}
              </div>
              
              {/* Last fetched indicator */}
              {lastFetched && lastFetched.symbol === sym && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{lastFetched.tf} • {lastFetched.count} candles</span>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* All other symbols (demo only) */}
      {source === "demo" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
          <h3 className="text-sm font-semibold text-white/60 mb-3">All Demo Symbols</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {DEMO_SYMBOLS.filter(s => !FOCUS_SYMBOLS.includes(s as any)).map((sym) => (
              <div key={sym} className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="w-20 text-xs font-medium text-white/70">{sym}</span>
                {TIMEFRAMES.slice(0, 4).map((tf) => (
                  <motion.button
                    key={tf}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={busy}
                    onClick={() => onGenerateDemo(sym, tf)}
                    className="px-2 py-1 rounded text-[10px] font-medium bg-white/5 text-white/60 hover:bg-emerald-500/20 hover:text-emerald-300 border border-white/10"
                  >
                    {tf}
                  </motion.button>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Stats Footer */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 pt-4 border-t border-emerald-900/30 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-white/60">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>{savedCount} datasets saved</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/60">
            <ExternalLink className="w-4 h-4 text-emerald-400" />
            <span>OANDA + Demo unified</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/market-data"
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 transition"
          >
            View All Datasets →
          </a>
        </div>
      </motion.div>

      {/* Status/Error Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2"
        >
          <span>⚠</span> {error}
        </motion.div>
      )}
      {status && !error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          {status}
        </motion.div>
      )}
      {busy && !error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          Sedang memproses...
        </motion.div>
      )}
    </motion.div>
  );
}