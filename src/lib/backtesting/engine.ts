import type {
  BacktestConfig,
  Candle,
  EquityPoint,
  ExitReason,
  Side,
  SymbolSpec,
  Trade,
} from "@/types/backtesting";
import {
  commissionCost,
  grossPnl,
  rMultiple,
} from "@/lib/calculations/pnl";
import {
  fixedLotPositionSize,
  fixedMoneyPositionSize,
  percentRiskPositionSize,
} from "@/lib/calculations/position-sizing";
import { computeMetrics, type MetricsResult } from "@/lib/calculations/metrics";
import { ENGINE_VERSION, type Strategy, type StrategyContext } from "./strategy";

interface Position {
  side: Side;
  entryPrice: number;
  quantity: number;
  stopLoss: number | null;
  takeProfit: number | null;
  entryTime: number;
  entryIndex: number;
  riskAmount: number;
  label?: string;
}

interface PendingOrder {
  side: Side;
  stopLoss?: number;
  takeProfit?: number;
  quantity?: number;
  label?: string;
}

export interface RunResult {
  trades: Trade[];
  equityPoints: EquityPoint[];
  metrics: MetricsResult;
  warnings: string[];
  engineVersion: string;
}

function round(v: number, p: number): number {
  const f = 10 ** p;
  return Math.round(v * f) / f;
}

function determineQuantity(
  config: BacktestConfig,
  side: Side,
  entryPrice: number,
  stopLoss: number | null,
  explicitQty: number | undefined,
  equity: number,
  spec: SymbolSpec,
): number {
  if (explicitQty !== undefined && explicitQty > 0) return explicitQty;
  const cs = spec.contractSize || 1;
  switch (config.risk.mode) {
    case "fixed_lot":
      return config.risk.fixedLot ?? 0;
    case "percent_risk": {
      if (stopLoss === null || stopLoss === undefined) return 0;
      const pct = config.risk.riskPercent ?? 0;
      return percentRiskPositionSize(equity, pct, entryPrice, stopLoss, cs);
    }
    case "fixed_money": {
      if (stopLoss === null || stopLoss === undefined) return 0;
      const amt = config.risk.fixedRisk ?? 0;
      return fixedMoneyPositionSize(amt, entryPrice, stopLoss, cs);
    }
    default:
      return 0;
  }
}

function applyEntryAdjustment(
  side: Side,
  price: number,
  ex: BacktestConfig["execution"],
): number {
  const adj = ex.spread + ex.slippage;
  return side === "buy" ? price + adj : price - adj;
}

function applyExitAdjustment(
  side: Side,
  price: number,
  ex: BacktestConfig["execution"],
): number {
  const adj = ex.spread + ex.slippage;
  return side === "buy" ? price - adj : price + adj;
}

export function runBacktest(
  config: BacktestConfig,
  candlesInput: Candle[],
  strategy: Strategy,
): RunResult {
  const warnings: string[] = [];
  const candles = [...candlesInput].sort((a, b) => a.timestamp - b.timestamp);
  const spec = config.symbolSpec;
  const cs = spec.contractSize || 1;

  let balance = config.startingBalance;
  let equity = balance;
  let tradeIndex = 0;
  const trades: Trade[] = [];
  const equityPoints: EquityPoint[] = [];

  const state: { position: Position | null; pending: PendingOrder | null } = {
    position: null,
    pending: null,
  };

  const dailyPnl = new Map<string, number>();
  let maxDailyLossHit = false;
  let allowNewEntries = true;

  function openPosition(side: Side, entryPrice: number, ex: PendingOrder) {
    if (state.position || state.pending) return;
    const qty = determineQuantity(
      config,
      side,
      entryPrice,
      ex.stopLoss ?? null,
      ex.quantity,
      equity,
      spec,
    );
    if (qty <= 0) {
      warnings.push("Skipped order: non-positive position size.");
      return;
    }
    const riskPerUnit = Math.abs(entryPrice - (ex.stopLoss ?? entryPrice)) * cs;
    state.position = {
      side,
      entryPrice,
      quantity: qty,
      stopLoss: ex.stopLoss ?? null,
      takeProfit: ex.takeProfit ?? null,
      entryTime: 0,
      entryIndex: 0,
      riskAmount: riskPerUnit * qty,
      label: ex.label,
    };
  }

  function closePosition(exitPrice: number, reason: ExitReason, exitTime: number) {
    const pos = state.position as Position | null;
    if (!pos) return;
    const commission = commissionCost(
      config.execution.commissionModel,
      config.execution.commissionValue,
      Math.abs(pos.entryPrice) * pos.quantity * cs,
      pos.quantity,
    );
    const entrySlip = config.execution.slippage * pos.quantity * cs;
    const exitSlip = config.execution.slippage * pos.quantity * cs;
    const gpnl = grossPnl(pos.side, pos.entryPrice, exitPrice, pos.quantity, cs);
    const net = gpnl - commission - entrySlip - exitSlip;
    balance += net;
    const durationMs = exitTime - pos.entryTime;
    trades.push({
      id: `T${tradeIndex++}`,
      symbol: config.symbol,
      side: pos.side,
      entryTime: pos.entryTime,
      exitTime,
      entryPrice: round(pos.entryPrice, spec.pricePrecision),
      exitPrice: round(exitPrice, spec.pricePrecision),
      quantity: round(pos.quantity, spec.quantityPrecision),
      stopLoss: pos.stopLoss === null ? null : round(pos.stopLoss, spec.pricePrecision),
      takeProfit:
        pos.takeProfit === null ? null : round(pos.takeProfit, spec.pricePrecision),
      grossPnl: round(gpnl, 8),
      commission: round(commission, 8),
      slippage: round(entrySlip + exitSlip, 8),
      netPnl: round(net, 8),
      rMultiple: round(rMultiple(net, pos.riskAmount), 6),
      durationMs,
      exitReason: reason,
    });
    const day = new Date(exitTime).toISOString().slice(0, 10);
    dailyPnl.set(day, (dailyPnl.get(day) ?? 0) + net);
    state.position = null;
  }

  const ctx: StrategyContext = {
    candles,
    currentIndex: 0,
    config,
    symbolSpec: spec,
    equity,
    hasPosition: () => state.position !== null || state.pending !== null,
    open: (params) => {
      if (!allowNewEntries) return;
      state.pending = {
        side: params.side,
        stopLoss: params.stopLoss,
        takeProfit: params.takeProfit,
        quantity: params.quantity,
        label: params.label,
      };
    },
    close: (reason) => {
      const pos = state.position as Position | null;
      if (pos) {
        const c = candles[ctx.currentIndex];
        const px = applyExitAdjustment(pos.side, c.close, config.execution);
        closePosition(px, reason, c.timestamp);
      }
    },
  };

  const maxTrades = config.risk.maxTrades ?? Infinity;
  const maxDailyLoss = config.risk.maxDailyLoss ?? Infinity;

  strategy.initialize?.(ctx);

  for (let i = 0; i < candles.length; i++) {
    ctx.currentIndex = i;
    const candle = candles[i];
    const day = new Date(candle.timestamp).toISOString().slice(0, 10);
    if ((dailyPnl.get(day) ?? 0) <= -maxDailyLoss) maxDailyLossHit = true;

    // 1. Fill pending order from previous candle (next_open model)
    const openPend = state.pending;
    if (openPend) {
      state.pending = null;
      const fillPrice = applyEntryAdjustment(
        openPend.side,
        candle.open,
        config.execution,
      );
      openPosition(openPend.side, fillPrice, openPend);
      const np = state.position;
      if (np) {
        np.entryTime = candle.timestamp;
        np.entryIndex = i;
      }
    }

    // 2. Check exits on current candle using high/low (no look-ahead)
    const pos = state.position as Position | null;
    if (pos) {
      if (pos.side === "buy") {
        const slHit = pos.stopLoss !== null && candle.low <= pos.stopLoss;
        const tpHit = pos.takeProfit !== null && candle.high >= pos.takeProfit;
        if (slHit || tpHit) {
          let reason: ExitReason;
          let exitPx: number;
          if (slHit && tpHit) {
            const rule = config.execution.tpSlCollision;
            const favorStop =
              rule === "stop_first" || rule === "both_touched_favor_broker";
            reason = favorStop ? "sl" : "tp";
            exitPx = applyExitAdjustment(
              pos.side,
              favorStop ? (pos.stopLoss as number) : (pos.takeProfit as number),
              config.execution,
            );
          } else if (slHit) {
            reason = "sl";
            exitPx = applyExitAdjustment(pos.side, pos.stopLoss as number, config.execution);
          } else {
            reason = "tp";
            exitPx = applyExitAdjustment(pos.side, pos.takeProfit as number, config.execution);
          }
          closePosition(exitPx, reason, candle.timestamp);
        }
      } else {
        const slHit = pos.stopLoss !== null && candle.high >= pos.stopLoss;
        const tpHit = pos.takeProfit !== null && candle.low <= pos.takeProfit;
        if (slHit || tpHit) {
          let reason: ExitReason;
          let exitPx: number;
          if (slHit && tpHit) {
            const rule = config.execution.tpSlCollision;
            const favorStop =
              rule === "stop_first" || rule === "both_touched_favor_broker";
            reason = favorStop ? "sl" : "tp";
            exitPx = applyExitAdjustment(
              pos.side,
              favorStop ? (pos.stopLoss as number) : (pos.takeProfit as number),
              config.execution,
            );
          } else if (slHit) {
            reason = "sl";
            exitPx = applyExitAdjustment(pos.side, pos.stopLoss as number, config.execution);
          } else {
            reason = "tp";
            exitPx = applyExitAdjustment(pos.side, pos.takeProfit as number, config.execution);
          }
          closePosition(exitPx, reason, candle.timestamp);
        }
      }
    }

    // 3. Strategy decision for this candle
    allowNewEntries = !maxDailyLossHit && trades.length < maxTrades;
    strategy.onCandle(ctx, candle);

    // If strategy opened a position with 'close' model, fill immediately at close
    const closePend = state.pending as PendingOrder | null;
    if (closePend && config.execution.executionModel === "close") {
      state.pending = null;
      const fillPrice = applyEntryAdjustment(
        closePend.side,
        candle.close,
        config.execution,
      );
      openPosition(closePend.side, fillPrice, closePend);
      const np = state.position as Position | null;
      if (np) {
        np.entryTime = candle.timestamp;
        np.entryIndex = i;
      }
    }

    // 4. Record equity
    let unrealized = 0;
    const recPos = state.position as Position | null;
    if (recPos) {
      unrealized = grossPnl(
        recPos.side,
        recPos.entryPrice,
        candle.close,
        recPos.quantity,
        cs,
      );
    }
    equity = balance + unrealized;
    equityPoints.push({
      timestamp: candle.timestamp,
      balance: round(balance, 8),
      equity: round(equity, 8),
      cumulativePnl: round(equity - config.startingBalance, 8),
      drawdown: 0,
      drawdownPct: 0,
    });
  }

  // Close any open position at end of data
  if (state.position) {
    const last = candles[candles.length - 1];
    const px = applyExitAdjustment(state.position.side, last.close, config.execution);
    closePosition(px, "end_of_data", last.timestamp);
  }

  strategy.finalize?.(ctx);

  const equityCurve = equityPoints.map((p) => p.equity);
  const metrics = computeMetrics({
    trades: trades.map((t) => ({
      netPnl: t.netPnl,
      grossPnl: t.grossPnl,
      commission: t.commission,
      slippage: t.slippage,
      rMultiple: t.rMultiple,
      side: t.side,
      entryTime: t.entryTime,
      exitTime: t.exitTime,
      exitReason: t.exitReason,
    })),
    startingBalance: config.startingBalance,
    equityCurve,
  });

  // Backfill drawdown on equity points
  let peak = equityCurve[0] ?? config.startingBalance;
  for (const p of equityPoints) {
    if (p.equity > peak) peak = p.equity;
    const dd = peak - p.equity;
    p.drawdown = round(dd, 8);
    p.drawdownPct = peak > 0 ? round((dd / peak) * 100, 4) : 0;
  }

  if (maxDailyLossHit) warnings.push("Max daily loss reached; new entries halted.");
  if (trades.length >= maxTrades) warnings.push("Max trades reached.");

  return {
    trades,
    equityPoints,
    metrics,
    warnings,
    engineVersion: ENGINE_VERSION,
  };
}
