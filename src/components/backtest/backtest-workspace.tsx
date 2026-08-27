"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { BacktestConfig, Candle, SymbolSpec } from "@/types/backtesting";
import { runBacktest, type RunResult } from "@/lib/backtesting/engine";
import { runBacktestInWorker, canUseWorker } from "@/lib/backtesting/worker-client";
import { DEMO_STRATEGIES, getStrategy } from "@/lib/backtesting";
import { CandlestickChart } from "@/components/charts/candlestick-chart";
import { MetricsPanel } from "@/components/backtest/metrics-panel";
import { EquityChart, DrawdownChart } from "@/components/backtest/equity-chart";
import { TradeTable } from "@/components/backtest/trade-table";
import { createClient } from "@/lib/supabase/client";
import { saveBacktestResult } from "@/lib/backtesting/persistence";
import { generateDemoCandles } from "@/lib/market-data/demo";

export interface DatasetOption {
  id: string;
  symbol: string;
  timeframe: string;
  candleCount: number;
  isDemo: boolean;
}

const DEFAULT_SPEC: SymbolSpec = {
  symbol: "GENERIC",
  baseAsset: "",
  quoteAsset: "USD",
  contractSize: 1,
  tickSize: 0.01,
  tickValue: 1,
  minQuantity: 0.01,
  maxQuantity: 1_000_000_000,
  quantityStep: 0.01,
  pricePrecision: 5,
  quantityPrecision: 2,
};

const inputCls =
  "w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-sm outline-none transition focus:border-white/15 focus:bg-white/[0.07] focus:ring-1 focus:ring-white/10";
const labelCls = "text-[10px] font-medium uppercase tracking-widest text-white/45";
const cardCls = "rounded-xl border border-white/[0.07] bg-[#151515]";

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/[0.06] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left"
      >
        <span className="text-xs font-semibold tracking-wide text-white/80">{title}</span>
        <span className="text-xs text-white/30">{open ? "—" : "+"}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function BacktestWorkspace({ datasets }: { datasets: DatasetOption[] }) {
  const [datasetId, setDatasetId] = useState(datasets[0]?.id ?? "");
  const [strategyId, setStrategyId] = useState(DEMO_STRATEGIES[0].id);
  const [capital, setCapital] = useState("10000");
  const [riskMode, setRiskMode] = useState<"fixed_lot" | "percent_risk">("fixed_lot");
  const [fixedLot, setFixedLot] = useState("1");
  const [riskPercent, setRiskPercent] = useState("1");
  const [spread, setSpread] = useState("0");
  const [commission, setCommission] = useState("0");
  const [slippage, setSlippage] = useState("0");
  const [collision, setCollision] = useState<"stop_first" | "limit_first">("stop_first");
  const [executionModel, setExecutionModel] = useState<"close" | "next_open">("next_open");
  const [paramFast, setParamFast] = useState("10");
  const [paramSlow, setParamSlow] = useState("30");
  const [paramRsiPeriod, setParamRsiPeriod] = useState("14");
  const [paramRsiOb, setParamRsiOb] = useState("70");
  const [paramRsiOs, setParamRsiOs] = useState("30");
  const [paramLookback, setParamLookback] = useState("20");

  const [result, setResult] = useState<RunResult | null>(null);
  const [lastConfig, setLastConfig] = useState<BacktestConfig | null>(null);
  const [lastMarketDataSetId, setLastMarketDataSetId] = useState<string | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [demoCreating, setDemoCreating] = useState(false);
  const [showConfig, setShowConfig] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  const [bottomTab, setBottomTab] = useState<"trades" | "equity" | "drawdown" | "stats">("trades");

  const dataset = useMemo(() => datasets.find((d) => d.id === datasetId), [datasets, datasetId]);
  const strategy = useMemo(() => getStrategy(strategyId), [strategyId]);

  function buildStrategyParams(): Record<string, number | string> {
    if (strategyId === "sma_crossover") return { fast: Number(paramFast) || 10, slow: Number(paramSlow) || 30 };
    if (strategyId === "rsi_threshold")
      return { period: Number(paramRsiPeriod) || 14, overbought: Number(paramRsiOb) || 70, oversold: Number(paramRsiOs) || 30 };
    if (strategyId === "breakout") return { lookback: Number(paramLookback) || 20 };
    return {};
  }

  async function onRun() {
    setError(null);
    setResult(null);
    if (!dataset) {
      setError("Belum ada dataset — buat di Market Data dulu (Generate Demo atau Import CSV).");
      return;
    }
    setRunning(true);
    setProgress(null);
    try {
      const supabase = createClient();
      const { data, error: fetchErr } = await supabase
        .from("market_data_sets")
        .select("symbol, timeframe, metadata")
        .eq("id", datasetId)
        .single<{ symbol: string; timeframe: string; metadata: { candles?: Candle[] } }>();
      if (fetchErr) throw new Error(fetchErr.message);
      const dsCandles = data.metadata?.candles ?? [];
      if (dsCandles.length === 0) throw new Error("Dataset tidak punya candle.");

      const s = getStrategy(strategyId);
      if (!s) throw new Error("Strategy tidak ditemukan.");

      const config: BacktestConfig = {
        symbol: data.symbol,
        timeframe: data.timeframe,
        startingBalance: Number(capital) || 10000,
        currency: "USD",
        risk: { mode: riskMode, fixedLot: Number(fixedLot) || 0, riskPercent: Number(riskPercent) || 0, maxTrades: 10000 },
        execution: {
          spread: Number(spread) || 0,
          commissionModel: "flat",
          commissionValue: Number(commission) || 0,
          slippage: Number(slippage) || 0,
          executionModel,
          tpSlCollision: collision,
        },
        strategyId: s.id,
        strategyVersion: s.version,
        strategyParameters: buildStrategyParams(),
        symbolSpec: { ...DEFAULT_SPEC, symbol: data.symbol },
      };

      // Use Web Worker for large datasets to avoid UI freeze
      const useWorker = canUseWorker() && dsCandles.length >= 5000;
      if (useWorker) setProgress(`Processing ${dsCandles.length.toLocaleString()} candles in worker...`);
      else setProgress(`Processing ${dsCandles.length.toLocaleString()} candles...`);
      const run = useWorker ? await runBacktestInWorker(config, dsCandles) : runBacktest(config, dsCandles, s);
      setCandles(dsCandles);
      setResult(run);
      setLastConfig(config);
      setLastMarketDataSetId(datasetId);
      setSavedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Backtest gagal.");
    } finally {
      setRunning(false);
      setProgress(null);
    }
  }

  const hasNoDatasets = datasets.length === 0;

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/[0.07] bg-[#0f0f0f]/80 px-3 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-white/60 hover:bg-white/[0.06] hover:text-white"
          >
            {showConfig ? "Hide Config" : "Config"}
          </button>
          <button
            onClick={() => setShowMetrics(!showMetrics)}
            className="hidden rounded-md border border-white/10 px-2.5 py-1 text-xs text-white/60 hover:bg-white/[0.06] hover:text-white md:inline-flex"
          >
            {showMetrics ? "Hide Metrics" : "Metrics"}
          </button>
          <span className="hidden text-xs text-white/25 md:inline">·</span>
          <span className="hidden text-xs text-white/40 md:inline">
            {dataset ? `${dataset.symbol} ${dataset.timeframe} · ${dataset.candleCount} candles` : "No dataset"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <span className="hidden text-xs tabular-nums text-white/40 md:inline">
              {result.trades.length} trades · Engine v{result.engineVersion}
            </span>
          )}
          {progress && <span className="hidden text-xs text-white/40 md:inline">{progress}</span>}
          <button
            onClick={onRun}
            disabled={running}
            className="rounded-md bg-white px-4 py-1.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
          >
            {running ? "Running…" : "Run Backtest"}
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 flex-col gap-3 p-3 lg:flex-row">
        {/* Left: Config */}
        <AnimatePresence initial={false}>
          {showConfig && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 overflow-hidden"
            >
              <div className={`${cardCls} overflow-hidden`}>
                {hasNoDatasets && (
                  <div className="border-b border-amber-500/20 bg-amber-500/10 px-3 py-2.5">
                    <p className="text-xs font-medium text-amber-200">Belum ada dataset</p>
                    <p className="mt-1 text-xs leading-relaxed text-amber-200/70">
                      Klik tombol di bawah untuk buat data demo instan, atau buka <a href="/market-data" className="underline">Market Data</a> untuk Import CSV.
                    </p>
                    <button
                      disabled={demoCreating}
                      onClick={async () => {
                        setDemoCreating(true);
                        setError(null);
                        try {
                          const supabase = createClient();
                          const {
                            data: { user },
                          } = await supabase.auth.getUser();
                          if (!user) throw new Error("Belum login.");
                          const candles = generateDemoCandles("DEMOUSD", "1h", 1000);
                          const { error } = await supabase.from("market_data_sets").insert({
                            user_id: user.id,
                            symbol: "DEMOUSD",
                            market_type: "demo",
                            timeframe: "1h",
                            candle_count: candles.length,
                            start_time: new Date(candles[0].timestamp).toISOString(),
                            end_time: new Date(candles[candles.length - 1].timestamp).toISOString(),
                            is_demo: true,
                            metadata: { candles, source: "demo-inline" },
                          });
                          if (error) throw new Error(error.message);
                          window.location.reload();
                        } catch (e) {
                          setError(e instanceof Error ? e.message : "Gagal buat demo.");
                        } finally {
                          setDemoCreating(false);
                        }
                      }}
                      className="mt-2 w-full rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400 disabled:opacity-60"
                    >
                      {demoCreating ? "Membuat…" : "Buat DEMO 1h Sekarang (1 klik)"}
                    </button>
                  </div>
                )}

                <Section title="Market">
                  <div className="space-y-2.5">
                    <label className="block">
                      <span className={labelCls}>Dataset</span>
                      <select value={datasetId} onChange={(e) => setDatasetId(e.target.value)} className={`${inputCls} mt-1`}>
                        {datasets.length === 0 && <option value="">— no datasets —</option>}
                        {datasets.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.isDemo ? "[DEMO] " : ""}
                            {d.symbol} {d.timeframe} ({d.candleCount})
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </Section>

                <Section title="Strategy">
                  <div className="space-y-2.5">
                    <label className="block">
                      <span className={labelCls}>Strategy</span>
                      <select value={strategyId} onChange={(e) => setStrategyId(e.target.value)} className={`${inputCls} mt-1`}>
                        {DEMO_STRATEGIES.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </label>
                    <p className="text-xs leading-relaxed text-white/40">{strategy?.description}</p>
                    {strategyId === "sma_crossover" && (
                      <div className="grid grid-cols-2 gap-2">
                        <label className="block"><span className={labelCls}>Fast</span><input value={paramFast} onChange={(e) => setParamFast(e.target.value)} className={`${inputCls} mt-1`} /></label>
                        <label className="block"><span className={labelCls}>Slow</span><input value={paramSlow} onChange={(e) => setParamSlow(e.target.value)} className={`${inputCls} mt-1`} /></label>
                      </div>
                    )}
                    {strategyId === "rsi_threshold" && (
                      <div className="grid grid-cols-3 gap-2">
                        <label className="block"><span className={labelCls}>Period</span><input value={paramRsiPeriod} onChange={(e) => setParamRsiPeriod(e.target.value)} className={`${inputCls} mt-1`} /></label>
                        <label className="block"><span className={labelCls}>OB</span><input value={paramRsiOb} onChange={(e) => setParamRsiOb(e.target.value)} className={`${inputCls} mt-1`} /></label>
                        <label className="block"><span className={labelCls}>OS</span><input value={paramRsiOs} onChange={(e) => setParamRsiOs(e.target.value)} className={`${inputCls} mt-1`} /></label>
                      </div>
                    )}
                    {strategyId === "breakout" && (
                      <label className="block"><span className={labelCls}>Lookback</span><input value={paramLookback} onChange={(e) => setParamLookback(e.target.value)} className={`${inputCls} mt-1`} /></label>
                    )}
                    {strategyId === "long_hold" && (
                      <p className="rounded-md bg-emerald-500/10 px-2.5 py-2 text-xs text-emerald-200/80">
                        LONG instan di candle pertama — untuk test entry & P&L.
                      </p>
                    )}
                    <div className="flex gap-1.5 pt-1">
                      <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/50">LONG</span>
                      {strategyId !== "long_hold" && <span className="text-[10px] text-white/25">+ parameter sesuai strategy</span>}
                    </div>
                  </div>
                </Section>

                <Section title="Capital & Risk">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block"><span className={labelCls}>Capital</span><input value={capital} onChange={(e) => setCapital(e.target.value)} className={`${inputCls} mt-1`} /></label>
                    <label className="block">
                      <span className={labelCls}>Risk Mode</span>
                      <select value={riskMode} onChange={(e) => setRiskMode(e.target.value as typeof riskMode)} className={`${inputCls} mt-1`}>
                        <option value="fixed_lot">Fixed Lot</option>
                        <option value="percent_risk">% Risk</option>
                      </select>
                    </label>
                    {riskMode === "fixed_lot" ? (
                      <label className="block"><span className={labelCls}>Lot</span><input value={fixedLot} onChange={(e) => setFixedLot(e.target.value)} className={`${inputCls} mt-1`} /></label>
                    ) : (
                      <label className="block"><span className={labelCls}>Risk %</span><input value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} className={`${inputCls} mt-1`} /></label>
                    )}
                  </div>
                </Section>

                <Section title="Execution" defaultOpen={false}>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block"><span className={labelCls}>Spread</span><input value={spread} onChange={(e) => setSpread(e.target.value)} className={`${inputCls} mt-1`} /></label>
                    <label className="block"><span className={labelCls}>Commission</span><input value={commission} onChange={(e) => setCommission(e.target.value)} className={`${inputCls} mt-1`} /></label>
                    <label className="block"><span className={labelCls}>Slippage</span><input value={slippage} onChange={(e) => setSlippage(e.target.value)} className={`${inputCls} mt-1`} /></label>
                    <label className="block">
                      <span className={labelCls}>Exec</span>
                      <select value={executionModel} onChange={(e) => setExecutionModel(e.target.value as typeof executionModel)} className={`${inputCls} mt-1`}>
                        <option value="next_open">Next Open</option>
                        <option value="close">Close</option>
                      </select>
                    </label>
                    <label className="col-span-2 block">
                      <span className={labelCls}>TP/SL Collision</span>
                      <select value={collision} onChange={(e) => setCollision(e.target.value as typeof collision)} className={`${inputCls} mt-1`}>
                        <option value="stop_first">Stop First (worst)</option>
                        <option value="limit_first">Limit First</option>
                      </select>
                    </label>
                  </div>
                </Section>

                {error && <p className="px-3 pb-3 text-xs text-red-400">{error}</p>}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Center: Chart */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className={`${cardCls} p-2`}>
            {!result ? (
              <div className="flex min-h-[420px] flex-col gap-3 p-4">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                  <p className="text-xs font-semibold tracking-wide text-white/80">Cara entry LONG (3 langkah)</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-lg bg-white/[0.04] p-2.5">
                      <p className="text-[10px] font-bold tracking-widest text-white/30">LANGKAH 1</p>
                      <p className="mt-1 text-xs font-medium text-white">Punya Dataset</p>
                      <p className="text-xs leading-relaxed text-white/40">Kiri → jika ada kotak kuning, klik <span className="text-amber-200">Buat DEMO</span> (1 klik). Atau Market Data → Generate.</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.04] p-2.5">
                      <p className="text-[10px] font-bold tracking-widest text-white/30">LANGKAH 2</p>
                      <p className="mt-1 text-xs font-medium text-white">Pilih LONG</p>
                      <p className="text-xs leading-relaxed text-white/40">Kiri → Strategy = <span className="text-emerald-200">Long & Hold (Test)</span> (sudah default). Ini langsung BUY di candle pertama.</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.04] p-2.5">
                      <p className="text-[10px] font-bold tracking-widest text-white/30">LANGKAH 3</p>
                      <p className="mt-1 text-xs font-medium text-white">Run</p>
                      <p className="text-xs leading-relaxed text-white/40">Klik tombol putih <span className="text-white">Run Backtest</span> di kanan atas. Chart + Trades muncul di bawah.</p>
                    </div>
                  </div>
                  <button onClick={onRun} className="mt-3 w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90">
                    ▶ Run Long & Hold Sekarang
                  </button>
                  <p className="mt-2 text-center text-[10px] text-white/25">Setelah Run: lihat panah hijau B di chart = entry LONG.</p>
                </div>
                <div className="flex-1 rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-3">
                  <p className="text-xs font-medium text-white/50">Preview chart (akan terrender setelah Run)</p>
                  <div className="mt-2 h-24 rounded bg-gradient-to-r from-emerald-500/10 via-white/[0.03] to-red-500/10" />
                </div>
              </div>
            ) : (
              <CandlestickChart candles={candles} trades={result.trades} />
            )}
          </div>

          {/* Bottom tabs */}
          {result && (
            <div className={cardCls}>
              <div className="flex gap-1 border-b border-white/[0.06] px-2 py-1.5">
                {(["trades", "equity", "drawdown", "stats"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setBottomTab(t)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition ${bottomTab === t ? "bg-white text-black" : "text-white/50 hover:bg-white/[0.06] hover:text-white"}`}
                  >
                    {t}
                  </button>
                ))}
                <span className="ml-auto flex items-center gap-2 text-xs tabular-nums text-white/35">
                  {result.trades.length} trades
                  {result.warnings.length > 0 && <span className="text-amber-300">{result.warnings.length} warnings</span>}
                </span>
              </div>
              <div className="p-2">
                {bottomTab === "trades" && <TradeTable trades={result.trades} />}
                {bottomTab === "equity" && <div className="p-2"><EquityChart points={result.equityPoints} /></div>}
                {bottomTab === "drawdown" && <div className="p-2"><DrawdownChart points={result.equityPoints} /></div>}
                {bottomTab === "stats" && (
                  <div className="space-y-2 p-2 text-xs">
                    <p className="text-white/60">P&L per-trade, profit factor, expectancy, Sharpe/Sortino dari engine — lihat Metrics di panel kanan.</p>
                    {result.warnings.map((w, i) => (
                      <p key={i} className="text-amber-200/70">• {w}</p>
                    ))}
                    {result.warnings.length === 0 && <p className="text-white/30">No warnings.</p>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Metrics */}
        <AnimatePresence initial={false}>
          {showMetrics && result && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="hidden shrink-0 overflow-hidden lg:block"
            >
              <div className={`${cardCls} p-3`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold tracking-wide text-white/80">Metrics</h3>
                  <span className="text-[10px] text-white/30">Engine v{result.engineVersion}</span>
                </div>
                <div className="mt-3">
                  <MetricsPanel m={result.metrics} />
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <button
                    onClick={async () => {
                      if (!lastConfig || !result) return;
                      setSaving(true);
                      setError(null);
                      try {
                        const supabase = createClient();
                        const id = await saveBacktestResult(supabase, {
                          config: lastConfig,
                          candlesMeta: { symbol: lastConfig.symbol, timeframe: lastConfig.timeframe, candleCount: candles.length },
                          marketDataSetId: lastMarketDataSetId,
                          result,
                        });
                        setSavedId(id);
                      } catch (e) {
                        setError(e instanceof Error ? e.message : "Save failed.");
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving || !!savedId}
                    className="w-full rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
                  >
                    {savedId ? "Saved ✓" : saving ? "Saving…" : "Save Result"}
                  </button>
                  {savedId && <a href={`/results/${savedId}`} className="text-center text-xs text-white/60 underline">View saved →</a>}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const blob = new Blob([JSON.stringify({ config: lastConfig, result }, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `backtest-${Date.now()}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="rounded-md border border-white/10 px-2 py-1.5 text-xs text-white/60 hover:bg-white/[0.06]"
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => {
                        const h = "id,symbol,side,entryTime,exitTime,entryPrice,exitPrice,quantity,netPnl,rMultiple,exitReason";
                        const rows = result.trades.map((t) => `${t.id},${t.symbol},${t.side},${t.entryTime},${t.exitTime ?? ""},${t.entryPrice},${t.exitPrice ?? ""},${t.quantity},${t.netPnl},${t.rMultiple},${t.exitReason ?? ""}`).join("\n");
                        const blob = new Blob([h + "\n" + rows], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `trades-${Date.now()}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="rounded-md border border-white/10 px-2 py-1.5 text-xs text-white/60 hover:bg-white/[0.06]"
                    >
                      CSV
                    </button>
                  </div>
                  <p className="text-[10px] leading-relaxed text-white/25">Backtesting historis tidak menjamin performa masa depan.</p>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile metrics fallback */}
      {result && (
        <div className="lg:hidden">
          <div className={`${cardCls} p-3`}>
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-white/80">Metrics</h3>
            <MetricsPanel m={result.metrics} />
          </div>
        </div>
      )}
    </div>
  );
}
