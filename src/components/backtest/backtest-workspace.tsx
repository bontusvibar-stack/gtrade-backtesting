"use client";

import { useMemo, useState } from "react";
import type { BacktestConfig, Candle, SymbolSpec } from "@/types/backtesting";
import { runBacktest, type RunResult } from "@/lib/backtesting/engine";
import { DEMO_STRATEGIES, getStrategy } from "@/lib/backtesting";
import { CandlestickChart } from "@/components/charts/candlestick-chart";
import { MetricsPanel } from "@/components/backtest/metrics-panel";
import { EquityChart, DrawdownChart } from "@/components/backtest/equity-chart";
import { TradeTable } from "@/components/backtest/trade-table";
import { createClient } from "@/lib/supabase/client";
import { saveBacktestResult } from "@/lib/backtesting/persistence";

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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring";

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

  const [result, setResult] = useState<RunResult | null>(null);
  const [lastConfig, setLastConfig] = useState<BacktestConfig | null>(null);
  const [lastMarketDataSetId, setLastMarketDataSetId] = useState<string | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dataset = useMemo(
    () => datasets.find((d) => d.id === datasetId),
    [datasets, datasetId],
  );

  async function onRun() {
    setError(null);
    setResult(null);
    if (!dataset) {
      setError("Select or create a dataset first (Market Data page).");
      return;
    }
    setRunning(true);
    try {
      const supabase = createClient();
      const { data, error: fetchErr } = await supabase
        .from("market_data_sets")
        .select("symbol, timeframe, metadata")
        .eq("id", datasetId)
        .single<{
          symbol: string;
          timeframe: string;
          metadata: { candles?: Candle[] };
        }>();
      if (fetchErr) throw new Error(fetchErr.message);
      const dsCandles = data.metadata?.candles ?? [];
      if (dsCandles.length === 0) throw new Error("Dataset has no candles.");

      const strategy = getStrategy(strategyId);
      if (!strategy) throw new Error("Strategy not found.");

      const config: BacktestConfig = {
        symbol: data.symbol,
        timeframe: data.timeframe,
        startingBalance: Number(capital) || 10000,
        currency: "USD",
        risk: {
          mode: riskMode,
          fixedLot: Number(fixedLot) || 0,
          riskPercent: Number(riskPercent) || 0,
          maxTrades: 10000,
        },
        execution: {
          spread: Number(spread) || 0,
          commissionModel: "flat",
          commissionValue: Number(commission) || 0,
          slippage: Number(slippage) || 0,
          executionModel,
          tpSlCollision: collision,
        },
        strategyId: strategy.id,
        strategyVersion: strategy.version,
        strategyParameters: {},
        symbolSpec: { ...DEFAULT_SPEC, symbol: data.symbol },
      };

      const run = runBacktest(config, dsCandles, strategy);
      setCandles(dsCandles);
      setResult(run);
      setLastConfig(config);
      setLastMarketDataSetId(datasetId);
      setSavedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Backtest failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Configuration */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Configuration</h2>
          <button
            onClick={onRun}
            disabled={running}
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {running ? "Running…" : "Run Backtest"}
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Field label="Dataset">
            <select
              value={datasetId}
              onChange={(e) => setDatasetId(e.target.value)}
              className={inputCls}
            >
              {datasets.length === 0 && <option value="">— no datasets —</option>}
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.isDemo ? "[DEMO] " : ""}
                  {d.symbol} {d.timeframe} ({d.candleCount})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Strategy">
            <select
              value={strategyId}
              onChange={(e) => setStrategyId(e.target.value)}
              className={inputCls}
            >
              {DEMO_STRATEGIES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Starting Capital">
            <input value={capital} onChange={(e) => setCapital(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Risk Mode">
            <select
              value={riskMode}
              onChange={(e) => setRiskMode(e.target.value as typeof riskMode)}
              className={inputCls}
            >
              <option value="fixed_lot">Fixed Lot</option>
              <option value="percent_risk">% Risk</option>
            </select>
          </Field>
          {riskMode === "fixed_lot" ? (
            <Field label="Lot Size">
              <input value={fixedLot} onChange={(e) => setFixedLot(e.target.value)} className={inputCls} />
            </Field>
          ) : (
            <Field label="Risk %">
              <input value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} className={inputCls} />
            </Field>
          )}
          <Field label="Spread">
            <input value={spread} onChange={(e) => setSpread(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Commission (flat)">
            <input value={commission} onChange={(e) => setCommission(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Slippage">
            <input value={slippage} onChange={(e) => setSlippage(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Execution">
            <select
              value={executionModel}
              onChange={(e) => setExecutionModel(e.target.value as typeof executionModel)}
              className={inputCls}
            >
              <option value="next_open">Next Open</option>
              <option value="close">Close</option>
            </select>
          </Field>
          <Field label="TP/SL Collision">
            <select
              value={collision}
              onChange={(e) => setCollision(e.target.value as typeof collision)}
              className={inputCls}
            >
              <option value="stop_first">Stop First (worst case)</option>
              <option value="limit_first">Limit First</option>
            </select>
          </Field>
        </div>
        {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
      </div>

      {/* Results */}
      {result && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={async () => {
                if (!lastConfig || !result) return;
                setSaving(true);
                setError(null);
                try {
                  const supabase = createClient();
                  const id = await saveBacktestResult(supabase, {
                    config: lastConfig,
                    candlesMeta: {
                      symbol: lastConfig.symbol,
                      timeframe: lastConfig.timeframe,
                      candleCount: candles.length,
                    },
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
              className="rounded-md border border-border bg-card px-4 py-1.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60"
            >
              {savedId ? "Saved ✓" : saving ? "Saving…" : "Save Result"}
            </button>
            {savedId && (
              <a href={`/results/${savedId}`} className="text-sm text-primary underline">
                View saved result
              </a>
            )}
            <button
              onClick={() => {
                const blob = new Blob(
                  [JSON.stringify({ config: lastConfig, result }, null, 2)],
                  { type: "application/json" },
                );
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `backtest-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="rounded-md border border-border bg-card px-4 py-1.5 text-sm transition-colors hover:bg-accent"
            >
              Export JSON
            </button>
            <button
              onClick={() => {
                const headers =
                  "id,symbol,side,entryTime,exitTime,entryPrice,exitPrice,quantity,netPnl,rMultiple,exitReason";
                const rows = result.trades
                  .map(
                    (t) =>
                      `${t.id},${t.symbol},${t.side},${t.entryTime},${t.exitTime ?? ""},${t.entryPrice},${t.exitPrice ?? ""},${t.quantity},${t.netPnl},${t.rMultiple},${t.exitReason ?? ""}`,
                  )
                  .join("\n");
                const csv = headers + "\n" + rows;
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `trades-${Date.now()}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="rounded-md border border-border bg-card px-4 py-1.5 text-sm transition-colors hover:bg-accent"
            >
              Export CSV
            </button>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold">Metrics</h2>
            <MetricsPanel m={result.metrics} />
          </div>

          <div className="rounded-lg border border-border bg-card p-3">
            <h3 className="mb-2 text-sm font-semibold">Candles & Trades</h3>
            <CandlestickChart candles={candles} trades={result.trades} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-3">
              <h3 className="mb-2 text-sm font-semibold">Equity Curve</h3>
              <EquityChart points={result.equityPoints} />
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <h3 className="mb-2 text-sm font-semibold">Drawdown %</h3>
              <DrawdownChart points={result.equityPoints} />
            </div>
          </div>

          {result.warnings.length > 0 && (
            <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
              {result.warnings.map((w, i) => (
                <p key={i}>{w}</p>
              ))}
            </div>
          )}

          <TradeTable trades={result.trades} />

          <p className="text-[10px] text-muted-foreground">
            Engine v{result.engineVersion}. Historical backtesting does not
            guarantee future performance.
          </p>
        </>
      )}
    </div>
  );
}
