"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Candle } from "@/types/backtesting";
import { CandlestickChart } from "@/components/charts/candlestick-chart";
import { grossPnl } from "@/lib/calculations/pnl";

interface DatasetOpt {
  id: string;
  symbol: string;
  timeframe: string;
  candle_count: number;
  is_demo: boolean;
  isDemo?: boolean;
}

export function ManualReplay({ datasets }: { datasets: DatasetOpt[] }) {
  const [datasetId, setDatasetId] = useState(datasets[0]?.id ?? "");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [index, setIndex] = useState(20);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<null | { side: "buy" | "sell"; entry: number; entryIdx: number }>(null);
  const [trades, setTrades] = useState<{ entry: number; exit: number; pnl: number }[]>([]);
  const [balance, setBalance] = useState(10000);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const visible = candles.slice(0, index + 1);

  const load = useCallback(async () => {
    if (!datasetId) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: e } = await supabase
        .from("market_data_sets")
        .select("metadata")
        .eq("id", datasetId)
        .single<{ metadata: { candles?: Candle[] } }>();
      if (e) throw new Error(e.message);
      const cs = data.metadata?.candles ?? [];
      if (cs.length === 0) throw new Error("Dataset has no candles");
      setCandles(cs);
      setIndex(Math.min(20, cs.length - 1));
      setPosition(null);
      setTrades([]);
      setBalance(10000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    const ms = Math.max(80, 800 / speed);
    timerRef.current = setInterval(() => {
      setIndex((i) => {
        if (i >= candles.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, ms);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, speed, candles.length]);

  function doBuy() {
    if (position) return;
    const c = candles[index];
    if (!c) return;
    setPosition({ side: "buy", entry: c.close, entryIdx: index });
  }
  function doSell() {
    if (position) return;
    const c = candles[index];
    if (!c) return;
    setPosition({ side: "sell", entry: c.close, entryIdx: index });
  }
  function doClose() {
    if (!position) return;
    const c = candles[index];
    const pnl = grossPnl(position.side, position.entry, c.close, 1, 1);
    setBalance((b) => b + pnl);
    setTrades((t) => [...t, { entry: position.entry, exit: c.close, pnl }]);
    setPosition(null);
  }

  const unreal = position ? grossPnl(position.side, position.entry, candles[index]?.close ?? position.entry, 1, 1) : 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select value={datasetId} onChange={(e) => setDatasetId(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1.5 text-sm">
          {datasets.map((d) => (
            <option key={d.id} value={d.id}>
              {d.isDemo ? "[DEMO] " : ""}
              {d.symbol} {d.timeframe} ({d.candle_count})
            </option>
          ))}
        </select>
        <button onClick={load} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent">Reload</button>
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={() => setPlaying((p) => !p)} className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-black">{playing ? "Pause" : "Play"}</button>
          <button onClick={() => setIndex((i) => Math.max(0, i - 1))} className="rounded-md border border-border px-2 py-1.5 text-xs">Prev</button>
          <button onClick={() => setIndex((i) => Math.min(candles.length - 1, i + 1))} className="rounded-md border border-border px-2 py-1.5 text-xs">Next</button>
          <button onClick={() => setIndex((i) => Math.min(candles.length - 1, i + 5))} className="rounded-md border border-border px-2 py-1.5 text-xs">+5</button>
          <button onClick={() => setIndex((i) => Math.min(candles.length - 1, i + 10))} className="rounded-md border border-border px-2 py-1.5 text-xs">+10</button>
          <button onClick={() => setIndex(20)} className="rounded-md border border-border px-2 py-1.5 text-xs">Reset</button>
          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="rounded-md border border-input bg-background px-2 py-1.5 text-xs">
            <option value={0.25}>0.25x</option>
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={5}>5x</option>
            <option value={10}>10x</option>
          </select>
        </div>
      </div>

      {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="grid gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-white/[0.07] bg-[#151515] p-3 lg:col-span-3">
          {visible.length > 0 ? <CandlestickChart candles={visible} height={380} /> : <p className="text-xs text-white/40">No data — pick dataset and reload.</p>}
          <p className="mt-2 text-center text-[10px] text-white/30">Showing {visible.length} / {candles.length} candles — future hidden</p>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border border-white/[0.07] bg-[#151515] p-3">
            <p className="text-xs font-semibold text-white/70">Account</p>
            <p className="mt-1 font-mono text-sm text-white">Balance {balance.toFixed(2)}</p>
            <p className={`font-mono text-xs ${unreal >= 0 ? "text-emerald-400" : "text-red-400"}`}>Unreal {unreal.toFixed(2)}</p>
            <p className="text-xs text-white/40">Candle {index + 1} / {candles.length}</p>
            {position ? <p className="mt-1 text-xs text-amber-200">Position: {position.side.toUpperCase()} @ {position.entry}</p> : <p className="text-xs text-white/30">No position</p>}
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-[#151515] p-3">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={doBuy} disabled={!!position} className="rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">BUY</button>
              <button onClick={doSell} disabled={!!position} className="rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">SELL</button>
              <button onClick={doClose} disabled={!position} className="col-span-2 rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/70 disabled:opacity-40">Close</button>
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-[#151515] p-3">
            <p className="text-xs font-semibold text-white/70">Trades ({trades.length})</p>
            <div className="mt-1 max-h-40 overflow-auto text-xs font-mono">
              {trades.length === 0 ? <p className="text-white/30">—</p> : trades.map((t, i) => <div key={i} className={t.pnl >= 0 ? "text-emerald-400" : "text-red-400"}>{t.pnl.toFixed(2)}</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
