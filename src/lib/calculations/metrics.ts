import type { Side, ExitReason } from "@/types/backtesting";
import { computeDrawdown } from "./drawdown";

export interface MetricsTrade {
  netPnl: number;
  grossPnl: number;
  commission: number;
  slippage: number;
  rMultiple: number;
  side: Side;
  entryTime: number;
  exitTime: number | null;
  exitReason: ExitReason | null;
}

export interface MetricsInput {
  trades: MetricsTrade[];
  startingBalance: number;
  equityCurve: number[];
  annualizationFactor?: number;
}

export interface MetricsResult {
  startingBalance: number;
  endingBalance: number;
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  totalReturn: number;
  winRate: number;
  lossRate: number;
  tradeCount: number;
  winningTrades: number;
  losingTrades: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  expectancy: number;
  averageR: number;
  maxDrawdown: number;
  maxDrawdownPct: number;
  recoveryFactor: number;
  sharpe: number;
  sortino: number;
  bestDay: number;
  worstDay: number;
  monthlyReturn: number;
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function stddev(xs: number[]): number {
  if (xs.length === 0) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length);
}

export function computeMetrics(input: MetricsInput): MetricsResult {
  const { trades, startingBalance, equityCurve, annualizationFactor = 252 } = input;
  const curve = equityCurve.length ? equityCurve : [startingBalance];
  const endingBalance = curve[curve.length - 1];
  const netProfit = trades.reduce((s, t) => s + t.netPnl, 0);
  const wins = trades.filter((t) => t.netPnl > 0);
  const losses = trades.filter((t) => t.netPnl <= 0);
  const grossProfit = wins.reduce((s, t) => s + t.netPnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.netPnl, 0));
  const tradeCount = trades.length;
  const winRate = tradeCount ? (wins.length / tradeCount) * 100 : 0;
  const lossRate = tradeCount ? (losses.length / tradeCount) * 100 : 0;
  const averageWin = wins.length ? grossProfit / wins.length : 0;
  const averageLoss = losses.length ? grossLoss / losses.length : 0;
  const largestWin = wins.length ? Math.max(...wins.map((t) => t.netPnl)) : 0;
  const largestLoss = losses.length ? Math.min(...losses.map((t) => t.netPnl)) : 0;
  const profitFactor =
    grossLoss === 0 ? (grossProfit > 0 ? Infinity : 0) : grossProfit / grossLoss;
  const expectancy = tradeCount ? netProfit / tradeCount : 0;
  const averageR = tradeCount
    ? trades.reduce((s, t) => s + t.rMultiple, 0) / tradeCount
    : 0;
  const totalReturn = startingBalance > 0 ? (netProfit / startingBalance) * 100 : 0;

  const dd = computeDrawdown(curve);
  const recoveryFactor =
    dd.maxDrawdown > 0
      ? netProfit / dd.maxDrawdown
      : netProfit > 0
        ? Infinity
        : 0;

  const stepReturns: number[] = [];
  for (let i = 1; i < curve.length; i++) {
    const prev = curve[i - 1];
    stepReturns.push(prev > 0 ? (curve[i] - prev) / prev : 0);
  }
  const rMean = mean(stepReturns);
  const rStd = stddev(stepReturns);
  const downside = stepReturns.filter((r) => r < 0);
  const dVar = downside.length
    ? downside.reduce((a, b) => a + b * b, 0) / stepReturns.length
    : 0;
  const dStd = Math.sqrt(dVar);
  const sharpe = rStd > 0 ? (rMean / rStd) * Math.sqrt(annualizationFactor) : 0;
  const sortino = dStd > 0 ? (rMean / dStd) * Math.sqrt(annualizationFactor) : 0;

  const dailyPnls = trades
    .filter((t) => t.exitTime !== null)
    .map((t) => ({ day: new Date(t.exitTime as number).toISOString().slice(0, 10), pnl: t.netPnl }));
  const byDay = new Map<string, number>();
  for (const d of dailyPnls) byDay.set(d.day, (byDay.get(d.day) ?? 0) + d.pnl);
  const dayValues = Array.from(byDay.values());
  const bestDay = dayValues.length ? Math.max(...dayValues) : 0;
  const worstDay = dayValues.length ? Math.min(...dayValues) : 0;

  const monthly = new Map<string, number>();
  for (const d of dailyPnls) {
    const m = d.day.slice(0, 7);
    monthly.set(m, (monthly.get(m) ?? 0) + d.pnl);
  }
  const monthlyReturn = monthly.size
    ? Array.from(monthly.values()).reduce((a, b) => a + b, 0)
    : 0;

  return {
    startingBalance,
    endingBalance,
    netProfit,
    grossProfit,
    grossLoss,
    totalReturn,
    winRate,
    lossRate,
    tradeCount,
    winningTrades: wins.length,
    losingTrades: losses.length,
    averageWin,
    averageLoss,
    largestWin,
    largestLoss,
    profitFactor,
    expectancy,
    averageR,
    maxDrawdown: dd.maxDrawdown,
    maxDrawdownPct: dd.maxDrawdownPct,
    recoveryFactor,
    sharpe,
    sortino,
    bestDay,
    worstDay,
    monthlyReturn,
  };
}
