import type { SupabaseClient } from "@supabase/supabase-js";
import type { BacktestConfig, Candle } from "@/types/backtesting";
import type { RunResult } from "./engine";
import { ENGINE_VERSION } from "./strategy";

export interface SaveResultInput {
  config: BacktestConfig;
  candlesMeta: { symbol: string; timeframe: string; candleCount: number };
  marketDataSetId: string | null;
  result: RunResult;
}

export async function saveBacktestResult(
  supabase: SupabaseClient,
  input: SaveResultInput,
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { config, marketDataSetId, result } = input;

  const { data: run, error: runErr } = await supabase
    .from("backtest_runs")
    .insert({
      user_id: user.id,
      engine_version: ENGINE_VERSION,
      status: "complete",
      market_data_set_id: marketDataSetId,
    })
    .select("id")
    .single<{ id: string }>();
  if (runErr) throw new Error(runErr.message);
  const runId = run.id;

  const { error: cfgErr } = await supabase.from("backtest_configs").insert({
    backtest_run_id: runId,
    user_id: user.id,
    symbol: config.symbol,
    market_type: config.marketType ?? null,
    timeframe: config.timeframe,
    starting_balance: config.startingBalance,
    currency: config.currency,
    risk: config.risk as unknown as Record<string, unknown>,
    execution: config.execution as unknown as Record<string, unknown>,
    strategy_parameters: config.strategyParameters as unknown as Record<
      string,
      unknown
    >,
    snapshot: {
      config,
      candlesMeta: input.candlesMeta,
      engineVersion: ENGINE_VERSION,
    } as unknown as Record<string, unknown>,
  });
  if (cfgErr) throw new Error(cfgErr.message);

  const { error: resErr } = await supabase.from("backtest_results").insert({
    backtest_run_id: runId,
    user_id: user.id,
    net_pnl: result.metrics.netProfit,
    total_return: result.metrics.totalReturn,
    win_rate: result.metrics.winRate,
    profit_factor:
      Number.isFinite(result.metrics.profitFactor) ? result.metrics.profitFactor : null,
    expectancy: result.metrics.expectancy,
    average_r: result.metrics.averageR,
    max_drawdown: result.metrics.maxDrawdown,
    max_drawdown_pct: result.metrics.maxDrawdownPct,
    recovery_factor:
      Number.isFinite(result.metrics.recoveryFactor) ? result.metrics.recoveryFactor : null,
    sharpe: result.metrics.sharpe,
    sortino: result.metrics.sortino,
    trade_count: result.metrics.tradeCount,
    metrics: result.metrics as unknown as Record<string, unknown>,
    warnings: result.warnings,
  });
  if (resErr) throw new Error(resErr.message);

  if (result.trades.length > 0) {
    const rows = result.trades.map((t) => ({
      backtest_run_id: runId,
      user_id: user.id,
      symbol: t.symbol,
      side: t.side,
      entry_time: new Date(t.entryTime).toISOString(),
      exit_time: t.exitTime ? new Date(t.exitTime).toISOString() : null,
      entry_price: t.entryPrice,
      exit_price: t.exitPrice,
      quantity: t.quantity,
      stop_loss: t.stopLoss,
      take_profit: t.takeProfit,
      gross_pnl: t.grossPnl,
      commission: t.commission,
      slippage: t.slippage,
      net_pnl: t.netPnl,
      r_multiple: t.rMultiple,
      duration: t.durationMs !== null ? `${t.durationMs} milliseconds` : null,
      exit_reason: t.exitReason,
    }));
    const { error: trErr } = await supabase.from("trades").insert(rows);
    if (trErr) throw new Error(trErr.message);
  }

  if (result.equityPoints.length > 0) {
    // chunk to avoid row limits (save at most every Nth point for large series)
    const chunkSize = 500;
    const sampled =
      result.equityPoints.length > 2000
        ? result.equityPoints.filter(
            (_, i) => i % Math.ceil(result.equityPoints.length / 2000) === 0,
          )
        : result.equityPoints;
    const eqRows = sampled.map((p) => ({
      backtest_run_id: runId,
      user_id: user.id,
      timestamp: new Date(p.timestamp).toISOString(),
      balance: p.balance,
      equity: p.equity,
      cumulative_pnl: p.cumulativePnl,
      drawdown: p.drawdown,
      drawdown_pct: p.drawdownPct,
    }));
    for (let i = 0; i < eqRows.length; i += chunkSize) {
      const chunk = eqRows.slice(i, i + chunkSize);
      const { error: eqErr } = await supabase.from("equity_points").insert(chunk);
      if (eqErr) throw new Error(eqErr.message);
    }
  }

  return runId;
}

export async function exportResultJson(
  supabase: SupabaseClient,
  runId: string,
): Promise<Record<string, unknown>> {
  const { data: run } = await supabase
    .from("backtest_runs")
    .select("*, backtest_configs(*), backtest_results(*)")
    .eq("id", runId)
    .single();
  const { data: trades } = await supabase.from("trades").select("*").eq("backtest_run_id", runId);
  const { data: equity } = await supabase
    .from("equity_points")
    .select("*")
    .eq("backtest_run_id", runId)
    .order("timestamp");
  return { run, trades, equity, exportedAt: new Date().toISOString(), schemaVersion: 1 };
}
