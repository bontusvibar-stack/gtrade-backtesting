export type Side = "buy" | "sell";
export type OrderType = "market" | "limit" | "stop" | "stop_limit";
export type ExitReason =
  | "tp"
  | "sl"
  | "trailing_stop"
  | "signal"
  | "manual"
  | "end_of_data"
  | "max_trades"
  | "max_daily_loss"
  | "margin_call";

export type RiskMode = "fixed_lot" | "percent_risk" | "fixed_money";
export type CommissionModel = "percent" | "per_unit" | "flat";
export type ExecutionModel = "close" | "next_open";
export type TpSlCollision = "stop_first" | "limit_first" | "both_touched_favor_broker";

export interface Candle {
  timestamp: number; // epoch ms, UTC
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SymbolSpec {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  contractSize: number;
  tickSize: number;
  tickValue: number;
  minQuantity: number;
  maxQuantity: number;
  quantityStep: number;
  pricePrecision: number;
  quantityPrecision: number;
}

export interface RiskConfig {
  mode: RiskMode;
  fixedLot?: number;
  riskPercent?: number;
  fixedRisk?: number;
  maxDailyLoss?: number;
  maxTrades?: number;
  maxPositions?: number;
  maxPositionSize?: number;
  maxConsecutiveLosses?: number;
  leverage?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface ExecutionConfig {
  spread: number;
  commissionModel: CommissionModel;
  commissionValue: number;
  slippage: number;
  executionModel: ExecutionModel;
  tpSlCollision: TpSlCollision;
}

export interface BacktestConfig {
  symbol: string;
  marketType?: string;
  timeframe: string;
  dateRange?: { start?: number; end?: number };
  startingBalance: number;
  currency: string;
  risk: RiskConfig;
  execution: ExecutionConfig;
  strategyId: string;
  strategyVersion: number;
  strategyParameters: Record<string, number | string>;
  symbolSpec: SymbolSpec;
}

export interface Trade {
  id: string;
  symbol: string;
  side: Side;
  entryTime: number;
  exitTime: number | null;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  stopLoss: number | null;
  takeProfit: number | null;
  grossPnl: number;
  commission: number;
  slippage: number;
  netPnl: number;
  rMultiple: number;
  durationMs: number | null;
  exitReason: ExitReason | null;
}

export interface EquityPoint {
  timestamp: number;
  balance: number;
  equity: number;
  cumulativePnl: number;
  drawdown: number;
  drawdownPct: number;
}
