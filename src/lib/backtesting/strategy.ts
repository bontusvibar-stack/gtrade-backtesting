import type {
  BacktestConfig,
  Candle,
  ExitReason,
  Side,
  SymbolSpec,
} from "@/types/backtesting";

export interface OpenParams {
  side: Side;
  type?: "market" | "limit" | "stop" | "stop_limit";
  limitPrice?: number;
  stopPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  trailingStop?: number;
  quantity?: number;
  label?: string;
}

export interface StrategyContext {
  candles: Candle[];
  currentIndex: number;
  config: BacktestConfig;
  symbolSpec: SymbolSpec;
  equity: number;
  hasPosition(): boolean;
  open(params: OpenParams): void;
  close(reason: ExitReason): void;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  version: number;
  parameters: Record<string, number | string>;
  initialize?(ctx: StrategyContext): void;
  onCandle(ctx: StrategyContext, candle: Candle): void;
  finalize?(ctx: StrategyContext): void;
}

export const ENGINE_VERSION = "0.2.0";
