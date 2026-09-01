import { z } from "zod";

export const TradingViewWebhookSchema = z.object({
  secret: z.string().min(1),
  symbol: z.string().min(1).max(20),
  action: z.enum(["BUY", "SELL"]),
  price: z.coerce.number().positive(),
  timeframe: z.string().min(1),
  strategy: z.string().optional(),
  timestamp: z.string().optional(),
  stopLoss: z.coerce.number().optional(),
  takeProfit: z.coerce.number().optional(),
  event_id: z.string().optional(),
});

export type TradingViewWebhookPayload = z.infer<typeof TradingViewWebhookSchema>;

export interface TradingSignal {
  id: string;
  userId: string;
  symbol: string;
  action: "BUY" | "SELL";
  entryPrice: number;
  timeframe: string;
  strategy?: string;
  stopLoss?: number;
  takeProfit?: number;
  timestamp: Date;
  source: "tradingview";
}

export interface MarketDataProvider {
  getQuote(symbol: string): Promise<{ price: number; bid: number; ask: number }>;
  getHistoricalData(symbol: string, timeframe: string): Promise<import("@/types/backtesting").Candle[]>;
}

export interface BrokerAdapter {
  getAccount(): Promise<{ balance: number; equity: number }>;
  getPositions(): Promise<unknown[]>;
  placeOrder(order: unknown): Promise<unknown>;
  closePosition(id: string): Promise<void>;
}
