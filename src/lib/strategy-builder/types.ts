export type Operator = ">" | "<" | ">=" | "<=" | "==" | "cross_above" | "cross_below";
export type OperandType = "price" | "indicator" | "value";
export type LogicOp = "AND" | "OR";

export interface Operand {
  type: OperandType;
  // price: open/high/low/close
  // indicator: e.g. SMA_20, EMA_50, RSI_14
  ref: string;
  param?: number; // for indicator period
}

export interface Condition {
  id: string;
  left: Operand;
  operator: Operator;
  right: Operand;
  not?: boolean;
}

export interface ConditionGroup {
  id: string;
  logic: LogicOp;
  conditions: (Condition | ConditionGroup)[];
}

export interface StrategyRule {
  id: string;
  name: string;
  entry: ConditionGroup;
  exit?: ConditionGroup;
  stopLoss?: string; // e.g. "ATR*2" or "2%"
  takeProfit?: string;
  trailingStop?: number;
}

export function isGroup(c: Condition | ConditionGroup): c is ConditionGroup {
  return (c as ConditionGroup).logic !== undefined;
}

export const INDICATOR_OPTIONS = ["SMA", "EMA", "RSI", "ATR", "BB_upper", "BB_lower", "MACD", "Stoch_K", "ADX", "CCI", "Supertrend", "PSAR", "WMA", "VWAP", "ROC", "Momentum"] as const;
export const PRICE_OPTIONS = ["open", "high", "low", "close"] as const;
