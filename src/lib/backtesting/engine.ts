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
  swapCost,
} from "@/lib/calculations/pnl";
import {
  fixedLotPositionSize,
  fixedMoneyPositionSize,
  percentRiskPositionSize,
} from "@/lib/calculations/position-sizing";
import { computeMetrics, type MetricsResult } from "@/lib/calculations/metrics";
import { calculateMargin, requiredMarginForOrder } from "@/lib/calculations/margin";
import { grossPnl as calcUnrealized } from "@/lib/calculations/pnl";
import { atr } from "@/lib/indicators/atr";
import { ENGINE_VERSION, type Strategy, type StrategyContext } from "./strategy";

interface Position {
  side: Side;
  entryPrice: number;
  quantity: number;
  requestedQty?: number;
  stopLoss: number | null;
  takeProfit: number | null;
  trailingStop?: number | null;
  trailingOffset?: number | null; // distance from peak/trough
  entryTime: number;
  entryIndex: number;
  riskAmount: number;
  label?: string;
}

interface PendingOrder {
  side: Side;
  type?: "market" | "limit" | "stop" | "stop_limit";
  limitPrice?: number;
  stopPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  trailingStop?: number | null;
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

function getDynamicSpread(candle: Candle, ex: BacktestConfig["execution"], allCandles: Candle[], idx: number): number {
  if (ex.spreadModel === "dynamic") {
    const mult = ex.dynamicSpreadAtrMultiplier ?? 0.1;
    // Use ATR(14) as volatility proxy; fallback to fixed spread
    if (idx >= 14) {
      const slice = allCandles.slice(Math.max(0, idx - 14), idx + 1);
      const vals = atr(slice, 14);
      const v = vals[vals.length - 1];
      if (v !== null && Number.isFinite(v)) return Math.max(ex.spread, v * mult);
    }
  }
  return ex.spread;
}

function applyEntryAdjustment(
  side: Side,
  price: number,
  ex: BacktestConfig["execution"],
  candle?: Candle,
  allCandles?: Candle[],
  idx?: number,
): number {
  const spread = candle && allCandles && idx !== undefined ? getDynamicSpread(candle, ex, allCandles, idx) : ex.spread;
  // BUY entry uses ask (price + spread), SELL entry uses bid (price - spread) per spec 16
  const adj = spread + ex.slippage;
  return side === "buy" ? price + adj : price - adj;
}

function applyExitAdjustment(
  side: Side,
  price: number,
  ex: BacktestConfig["execution"],
  candle?: Candle,
  allCandles?: Candle[],
  idx?: number,
): number {
  const spread = candle && allCandles && idx !== undefined ? getDynamicSpread(candle, ex, allCandles, idx) : ex.spread;
  const adj = spread + ex.slippage;
  // BUY exit uses bid (price - spread), SELL exit uses ask (price + spread)
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
    let qty = determineQuantity(
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
    // Partial fill simulation: if volume is low relative to order size, fill only fraction
    const currentCandle = candles[ctx.currentIndex];
    if (currentCandle && currentCandle.volume > 0) {
      const maxFillByVolume = currentCandle.volume / 100; // simplistic: 1 lot per 100 volume
      if (qty > maxFillByVolume && maxFillByVolume > 0) {
        const filled = Math.max(spec.minQuantity, Math.floor(maxFillByVolume / spec.quantityStep) * spec.quantityStep);
        if (filled < qty) {
          warnings.push(`Partial fill: requested ${qty} → filled ${filled} (volume ${currentCandle.volume}).`);
          qty = filled;
        }
      }
    }
    // Leverage / margin check
    const lev = config.risk.leverage ?? 0;
    if (lev > 0) {
      const req = requiredMarginForOrder(qty, entryPrice, cs, lev);
      const existing = state.position as Position | null;
      const unrealized = existing
        ? calcUnrealized(existing.side, existing.entryPrice, entryPrice, existing.quantity, cs)
        : 0;
      const { freeMargin } = calculateMargin(balance, unrealized, existing?.quantity ?? 0, existing?.entryPrice ?? entryPrice, cs, lev);
      // freeMargin already accounts for existing position; for new position we need freeMargin >= req
      // Simplified: if no existing position, equity = freeMargin
      const available = state.position ? freeMargin : equity;
      if (available < req) {
        warnings.push(`Order rejected: insufficient margin (need ${req.toFixed(2)}, free ${available.toFixed(2)}, leverage ${lev}x).`);
        return;
      }
      // Also check maxPositionSize if configured
      const maxPos = (config.risk as unknown as { maxPositionSize?: number }).maxPositionSize;
      if (maxPos !== undefined && qty > maxPos) {
        warnings.push(`Order rejected: position size ${qty} exceeds max ${maxPos}.`);
        return;
      }
    }
    const riskPerUnit = Math.abs(entryPrice - (ex.stopLoss ?? entryPrice)) * cs;
    state.position = {
      side,
      entryPrice,
      quantity: qty,
      requestedQty: ex.quantity ?? qty,
      stopLoss: ex.stopLoss ?? null,
      takeProfit: ex.takeProfit ?? null,
      trailingStop: ex.trailingStop ?? null,
      trailingOffset: ex.trailingStop ?? null,
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
    // Swap/funding: accrue per day held
    const msPerDay = 86400000;
    const daysHeld = Math.max(0, (exitTime - pos.entryTime) / msPerDay);
    const swap = swapCost(pos.side, pos.quantity, daysHeld, config.execution.swapLong ?? 0, config.execution.swapShort ?? 0, config.execution.fundingRate ?? 0, pos.entryPrice);
    // Partial fill modeling: if pending quantity was partially filled, adjust gross proportionally (already in qty)
    const net = gpnl - commission - entrySlip - exitSlip + swap;
    balance += net;
    const durationMs = exitTime - pos.entryTime;
    // Determine order state: if qty < requested, mark partially_filled else filled -> closed
    const orderState = pos.quantity < (pos as unknown as { requestedQty?: number }).requestedQty! ? "partially_filled" : "closed";
    trades.push({
      id: `T${tradeIndex++}`,
      symbol: config.symbol,
      side: pos.side,
      entryTime: pos.entryTime,
      exitTime,
      entryPrice: round(pos.entryPrice, spec.pricePrecision),
      exitPrice: round(exitPrice, spec.pricePrecision),
      quantity: round(pos.quantity, spec.quantityPrecision),
      filledQuantity: round(pos.quantity, spec.quantityPrecision),
      orderState: orderState as unknown as import("@/types/backtesting").OrderState,
      stopLoss: pos.stopLoss === null ? null : round(pos.stopLoss, spec.pricePrecision),
      takeProfit:
        pos.takeProfit === null ? null : round(pos.takeProfit, spec.pricePrecision),
      grossPnl: round(gpnl, 8),
      commission: round(commission, 8),
      slippage: round(entrySlip + exitSlip, 8),
      swap: round(swap, 8),
      netPnl: round(net, 8),
      rMultiple: round(rMultiple(net, pos.riskAmount), 6),
      durationMs,
      exitReason: reason,
    });
    const day = new Date(exitTime).toISOString().slice(0, 10);
    dailyPnl.set(day, (dailyPnl.get(day) ?? 0) + net);
    if (net < 0) consecLosses++;
    else if (net > 0) consecLosses = 0;
    if (consecLosses >= maxConsecLosses) {
      allowNewEntries = false;
      warnings.push(`Max consecutive losses (${maxConsecLosses}) reached — blocking new trades.`);
    }
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
        type: params.type ?? "market",
        limitPrice: params.limitPrice,
        stopPrice: params.stopPrice,
        stopLoss: params.stopLoss,
        takeProfit: params.takeProfit,
        trailingStop: params.trailingStop ?? null,
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
  const maxConsecLosses = (config.risk as unknown as { maxConsecutiveLosses?: number }).maxConsecutiveLosses ?? Infinity;
  let consecLosses = 0;

  // Session/news filter helpers (Spec 28)
  function isSessionAllowed(ts: number): boolean {
    const sess = config.session;
    if (!sess || !sess.enabled || sess.sessions.length === 0) return true;
    // Convert ts to hour in sess.timezone (default Asia/Jakarta)
    const tz = sess.timezone || "Asia/Jakarta";
    try {
      const fmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: tz });
      const hour = Number(fmt.format(new Date(ts)));
      // Simple mapping: Asia 0-8, London 8-16, New York 13-21 UTC-ish; approximate in local Jakarta time
      // Jakarta: Asia 07-15, London 14-22, New York 19-03 (overnight), Overlap London+NY 19-22
      const inAsia = hour >= 7 && hour < 15;
      const inLondon = hour >= 14 && hour < 22;
      const inNY = hour >= 19 || hour < 3;
      const inOverlap = hour >= 19 && hour < 22;
      const sessionMap: Record<string, boolean> = { asia: inAsia, london: inLondon, new_york: inNY, overlap: inOverlap };
      return sess.sessions.some((s) => sessionMap[s]);
    } catch {
      return true;
    }
  }

  let newsWarningEmitted = false;

  strategy.initialize?.(ctx);

  for (let i = 0; i < candles.length; i++) {
    ctx.currentIndex = i;
    const candle = candles[i];
    const day = new Date(candle.timestamp).toISOString().slice(0, 10);
    if ((dailyPnl.get(day) ?? 0) <= -maxDailyLoss) maxDailyLossHit = true;

    // News filter: if enabled but no dataset, emit one warning and never fabricate
    if (config.news?.enabled && !newsWarningEmitted) {
      warnings.push("News data unavailable — news filter ignored.");
      newsWarningEmitted = true;
    }

    // 1. Fill pending order from previous candle (next_open model) or check limit/stop triggers
    const openPend = state.pending;
    if (openPend) {
      let shouldFill = false;
      let fillPriceRaw: number | null = null;
      const typ = openPend.type ?? "market";
      if (typ === "market") {
        // Market fills at next open (or remains pending until next candle)
        if (config.execution.executionModel !== "close") {
          shouldFill = true;
          fillPriceRaw = candle.open;
        }
      } else if (typ === "limit") {
        const lp = openPend.limitPrice;
        if (lp !== undefined) {
          if (openPend.side === "buy" && candle.low <= lp) {
            shouldFill = true;
            fillPriceRaw = Math.min(candle.open, lp);
            // Conservative: fill at limit price if touched
            fillPriceRaw = lp;
          } else if (openPend.side === "sell" && candle.high >= lp) {
            shouldFill = true;
            fillPriceRaw = lp;
          }
        }
      } else if (typ === "stop") {
        const sp = openPend.stopPrice;
        if (sp !== undefined) {
          if (openPend.side === "buy" && candle.high >= sp) {
            shouldFill = true;
            fillPriceRaw = Math.max(candle.open, sp);
            fillPriceRaw = sp;
          } else if (openPend.side === "sell" && candle.low <= sp) {
            shouldFill = true;
            fillPriceRaw = sp;
          }
        }
      } else if (typ === "stop_limit") {
        const sp = openPend.stopPrice;
        const lp = openPend.limitPrice;
        if (sp !== undefined && lp !== undefined) {
          const stopHit =
            (openPend.side === "buy" && candle.high >= sp) ||
            (openPend.side === "sell" && candle.low <= sp);
          if (stopHit) {
            const limitHit =
              (openPend.side === "buy" && candle.low <= lp) ||
              (openPend.side === "sell" && candle.high >= lp);
            if (limitHit) {
              shouldFill = true;
              fillPriceRaw = lp;
            }
          }
        }
      }
      if (shouldFill && fillPriceRaw !== null) {
        state.pending = null;
        const fillPrice = applyEntryAdjustment(openPend.side, fillPriceRaw, config.execution);
        openPosition(openPend.side, fillPrice, openPend);
        const np = state.position;
        if (np) {
          np.entryTime = candle.timestamp;
          np.entryIndex = i;
        }
      }
      // market with close model keeps pending for bottom handler; limit/stop keeps pending until hit
    }

    // 2. Check exits on current candle using high/low (no look-ahead) + trailing stop
    const pos = state.position as Position | null;
    if (pos) {
      // Update trailing stop if configured
      if (pos.trailingOffset !== null && pos.trailingOffset !== undefined && pos.trailingOffset > 0) {
        if (pos.side === "buy") {
          const newStop = candle.high - pos.trailingOffset;
          if (pos.stopLoss === null || newStop > pos.stopLoss) {
            pos.stopLoss = newStop;
          }
        } else {
          const newStop = candle.low + pos.trailingOffset;
          if (pos.stopLoss === null || newStop < pos.stopLoss) {
            pos.stopLoss = newStop;
          }
        }
      }
      // Check SL/TP and trailing
      const isTrailingHit =
        pos.trailingOffset !== null &&
        pos.trailingOffset !== undefined &&
        pos.trailingOffset > 0 &&
        pos.stopLoss !== null &&
        ((pos.side === "buy" && candle.low <= pos.stopLoss) ||
          (pos.side === "sell" && candle.high >= pos.stopLoss));
      let exitReason: ExitReason | null = null;
      let exitPxRaw: number | null = null;
      if (pos.side === "buy") {
        const slHit = pos.stopLoss !== null && candle.low <= pos.stopLoss;
        const tpHit = pos.takeProfit !== null && candle.high >= pos.takeProfit;
        if (slHit || tpHit) {
          if (slHit && tpHit) {
            const rule = config.execution.tpSlCollision;
            const favorStop = rule === "stop_first" || rule === "both_touched_favor_broker";
            exitReason = favorStop ? "sl" : "tp";
            exitPxRaw = favorStop ? (pos.stopLoss as number) : (pos.takeProfit as number);
          } else if (slHit) {
            exitReason = isTrailingHit && slHit ? "trailing_stop" : "sl";
            exitPxRaw = pos.stopLoss as number;
          } else {
            exitReason = "tp";
            exitPxRaw = pos.takeProfit as number;
          }
        } else if (isTrailingHit) {
          exitReason = "trailing_stop";
          exitPxRaw = pos.stopLoss as number;
        }
      } else {
        const slHit = pos.stopLoss !== null && candle.high >= pos.stopLoss;
        const tpHit = pos.takeProfit !== null && candle.low <= pos.takeProfit;
        if (slHit || tpHit) {
          if (slHit && tpHit) {
            const rule = config.execution.tpSlCollision;
            const favorStop = rule === "stop_first" || rule === "both_touched_favor_broker";
            exitReason = favorStop ? "sl" : "tp";
            exitPxRaw = favorStop ? (pos.stopLoss as number) : (pos.takeProfit as number);
          } else if (slHit) {
            exitReason = isTrailingHit && slHit ? "trailing_stop" : "sl";
            exitPxRaw = pos.stopLoss as number;
          } else {
            exitReason = "tp";
            exitPxRaw = pos.takeProfit as number;
          }
        } else if (isTrailingHit) {
          exitReason = "trailing_stop";
          exitPxRaw = pos.stopLoss as number;
        }
      }
      if (exitReason && exitPxRaw !== null) {
        const px = applyExitAdjustment(pos.side, exitPxRaw, config.execution);
        closePosition(px, exitReason, candle.timestamp);
      }
      // Margin call check: if free margin negative, liquidate
      const lev = config.risk.leverage ?? 0;
      if (lev > 0 && state.position) {
        const unreal = grossPnl(pos.side, pos.entryPrice, candle.close, pos.quantity, cs);
        const { freeMargin } = calculateMargin(balance, unreal, pos.quantity, pos.entryPrice, cs, lev);
        if (freeMargin < 0) {
          const px = applyExitAdjustment(pos.side, candle.close, config.execution);
          closePosition(px, "margin_call" as ExitReason, candle.timestamp);
          warnings.push("Margin call: position liquidated.");
        }
      }
    }

    // 3. Strategy decision for this candle
    const sessionOk = isSessionAllowed(candle.timestamp);
    allowNewEntries = !maxDailyLossHit && trades.length < maxTrades && consecLosses < maxConsecLosses && sessionOk;
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
