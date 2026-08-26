"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BacktestConfig, Candle, SymbolSpec } from "@/types/backtesting";
import { runBacktest } from "@/lib/backtesting/engine";
import { getStrategy, DEMO_STRATEGIES } from "@/lib/backtesting";

interface DatasetOpt {
  id: string;
  symbol: string;
  timeframe: string;
  candle_count: number;
  is_demo: boolean;
}

const DEFAULT_SPEC: SymbolSpec = {
  symbol: "GEN",
  baseAsset: "",
  quoteAsset: "USD",
  contractSize: 1,
  tickSize: 0.01,
  tickValue: 1,
  minQuantity: 0.01,
  maxQuantity: 1e9,
  quantityStep: 0.01,
  pricePrecision: 5,
  quantityPrecision: 2,
};

const SAFETY_LIMIT = 500;

function enumerate(
  mins: Record<string, number>,
  maxs: Record<string, number>,
  steps: Record<string, number>,
): Record<string, number>[] {
  const keys = Object.keys(mins).filter((k) => maxs[k] !== undefined && steps[k] !== undefined);
  if (keys.length === 0) return [];
  const ranges: number[][] = keys.map((k) => {
    const arr: number[] = [];
    for (let v = mins[k]; v <= maxs[k] + 1e-9; v += steps[k]) arr.push(Number(v.toFixed(8)));
    return arr;
  });
  const total = ranges.reduce((a, r) => a * r.length, 1);
  if (total > SAFETY_LIMIT) return [];
  const out: Record<string, number>[] = [];
  function rec(idx: number, cur: Record<string, number>) {
    if (idx === keys.length) {
      out.push({ ...cur });
      return;
    }
    for (const v of ranges[idx]) {
      cur[keys[idx]] = v;
      rec(idx + 1, cur);
    }
  }
  rec(0, {});
  return out;
}

export function Optimizer({ datasets }: { datasets: DatasetOpt[] }) {
  const [datasetId, setDatasetId] = useState(datasets[0]?.id ?? "");
  const [strategyId, setStrategyId] = useState(DEMO_STRATEGIES[0].id);
  const [fastMin, setFastMin] = useState("5");
  const [fastMax, setFastMax] = useState("15");
  const [fastStep, setFastStep] = useState("5");
  const [slowMin, setSlowMin] = useState("20");
  const [slowMax, setSlowMax] = useState("40");
  const [slowStep, setSlowStep] = useState("10");
  const [target, setTarget] = useState("netProfit");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<{ params: Record<string, number>; netPnl: number; winRate: number; pf: number; trades: number }[]>([]);

  const combos = useMemo(
    () =>
      enumerate(
        { fast: Number(fastMin) || 0, slow: Number(slowMin) || 0 },
        { fast: Number(fastMax) || 0, slow: Number(slowMax) || 0 },
        { fast: Number(fastStep) || 1, slow: Number(slowStep) || 1 },
      ),
    [fastMin, fastMax, fastStep, slowMin, slowMax, slowStep],
  );

  async function onRun() {
    setError(null);
    setRows([]);
    if (combos.length === 0) {
      setError(`No combinations or exceeds safety limit (${SAFETY_LIMIT}). Reduce ranges.`);
      return;
    }
    const ds = datasets.find((d) => d.id === datasetId);
    if (!ds) {
      setError("Pick a dataset.");
      return;
    }
    setRunning(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("market_data_sets")
        .select("symbol, timeframe, metadata")
        .eq("id", datasetId)
        .single<{ symbol: string; timeframe: string; metadata: { candles?: Candle[] } }>();
      const candles = data?.metadata?.candles ?? [];
      if (candles.length === 0) throw new Error("Dataset has no candles.");
      const strategy = getStrategy(strategyId);
      if (!strategy) throw new Error("Strategy not found.");

      const results: typeof rows = [];
      for (const p of combos) {
        const cData = data as { symbol: string; timeframe: string };
        const cfg: BacktestConfig = {
          symbol: cData.symbol,
          timeframe: cData.timeframe,
          startingBalance: 10000,
          currency: "USD",
          risk: { mode: "fixed_lot", fixedLot: 1 },
          execution: {
            spread: 0,
            commissionModel: "flat",
            commissionValue: 0,
            slippage: 0,
            executionModel: "close",
            tpSlCollision: "stop_first",
          },
          strategyId: strategy.id,
          strategyVersion: strategy.version,
          strategyParameters: p,
          symbolSpec: { ...DEFAULT_SPEC, symbol: (data as { symbol: string }).symbol },
        };
        const r = runBacktest(cfg, candles, strategy);
        results.push({
          params: p,
          netPnl: r.metrics.netProfit,
          winRate: r.metrics.winRate,
          pf: r.metrics.profitFactor,
          trades: r.metrics.tradeCount,
        });
      }
      const key = target === "netProfit" ? "netPnl" : target === "winRate" ? "winRate" : "pf";
      results.sort(
        (a, b) =>
          (b as unknown as Record<string, number>)[key] -
          (a as unknown as Record<string, number>)[key],
      );
      setRows(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Optimize failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Dataset</span>
          <select
            value={datasetId}
            onChange={(e) => setDatasetId(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.is_demo ? "[DEMO] " : ""}
                {d.symbol} {d.timeframe} ({d.candle_count})
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Strategy</span>
          <select
            value={strategyId}
            onChange={(e) => setStrategyId(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          >
            {DEMO_STRATEGIES.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Target</span>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          >
            <option value="netProfit">Net Profit</option>
            <option value="winRate">Win Rate</option>
            <option value="pf">Profit Factor</option>
          </select>
        </label>
        <div className="flex items-end">
          <button
            onClick={onRun}
            disabled={running}
            className="w-full rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {running ? "Running…" : `Run ${combos.length} combo`}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs md:grid-cols-6">
        <label className="block">
          <span className="text-muted-foreground">fast min</span>
          <input value={fastMin} onChange={(e) => setFastMin(e.target.value)} className="mt-1 w-full rounded border border-input bg-background px-2 py-1 text-sm" />
        </label>
        <label className="block">
          <span className="text-muted-foreground">fast max</span>
          <input value={fastMax} onChange={(e) => setFastMax(e.target.value)} className="mt-1 w-full rounded border border-input bg-background px-2 py-1 text-sm" />
        </label>
        <label className="block">
          <span className="text-muted-foreground">fast step</span>
          <input value={fastStep} onChange={(e) => setFastStep(e.target.value)} className="mt-1 w-full rounded border border-input bg-background px-2 py-1 text-sm" />
        </label>
        <label className="block">
          <span className="text-muted-foreground">slow min</span>
          <input value={slowMin} onChange={(e) => setSlowMin(e.target.value)} className="mt-1 w-full rounded border border-input bg-background px-2 py-1 text-sm" />
        </label>
        <label className="block">
          <span className="text-muted-foreground">slow max</span>
          <input value={slowMax} onChange={(e) => setSlowMax(e.target.value)} className="mt-1 w-full rounded border border-input bg-background px-2 py-1 text-sm" />
        </label>
        <label className="block">
          <span className="text-muted-foreground">slow step</span>
          <input value={slowStep} onChange={(e) => setSlowStep(e.target.value)} className="mt-1 w-full rounded border border-input bg-background px-2 py-1 text-sm" />
        </label>
      </div>

      <p className="text-xs text-muted-foreground">
        Combinations: {combos.length} {combos.length > SAFETY_LIMIT ? `(exceeds limit ${SAFETY_LIMIT})` : ""} · Hard limit {SAFETY_LIMIT}
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-2 py-1.5 font-medium">#</th>
                <th className="px-2 py-1.5 font-medium">Params</th>
                <th className="px-2 py-1.5 font-medium">Net P&L</th>
                <th className="px-2 py-1.5 font-medium">Win %</th>
                <th className="px-2 py-1.5 font-medium">PF</th>
                <th className="px-2 py-1.5 font-medium">Trades</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {rows.map((r, i) => (
                <tr key={i} className={i === 0 ? "bg-chart-1/10" : "border-b border-border/30"}>
                  <td className="px-2 py-1">{i + 1}</td>
                  <td className="px-2 py-1">{JSON.stringify(r.params)}</td>
                  <td className={`px-2 py-1 font-semibold ${r.netPnl >= 0 ? "text-chart-1" : "text-loss"}`}>{r.netPnl.toFixed(2)}</td>
                  <td className="px-2 py-1">{r.winRate.toFixed(1)}%</td>
                  <td className="px-2 py-1">{Number.isFinite(r.pf) ? r.pf.toFixed(2) : "∞"}</td>
                  <td className="px-2 py-1">{r.trades}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
