import type { Candle } from "@/types/backtesting";
import { SUPPORTED_TIMEFRAMES, type MarketDataMeta, type MarketDataProvider, type TimeframeInfo } from "./provider";

const OANDA_API_BASE = "https://api-fxpractice.oanda.com/v3";
const OANDA_STREAM_BASE = "https://stream-fxpractice.oanda.com/v3";

const OANDA_TIMEFRAME_MAP: Record<string, string> = {
  "1m": "M1",
  "5m": "M5",
  "15m": "M15",
  "1h": "H1",
  "4h": "H4",
  "1d": "D",
};

const OANDA_INSTRUMENT_MAP: Record<string, string> = {
  "XAUUSD": "XAU_USD",
  "EURUSD": "EUR_USD",
  "GBPUSD": "GBP_USD",
  "USDJPY": "USD_JPY",
  "AUDUSD": "AUD_USD",
  "USDCAD": "USD_CAD",
  "NZDUSD": "NZD_USD",
  "EURJPY": "EUR_JPY",
  "GBPJPY": "GBP_JPY",
  "BTCUSD": "BTC_USD",
  "ETHUSD": "ETH_USD",
};

interface OandaCandle {
  time: string;
  bid: { o: string; h: string; l: string; c: string };
  ask: { o: string; h: string; l: string; c: string };
  mid: { o: string; h: string; l: string; c: string };
  volume: number;
  complete: boolean;
}

interface OandaResponse {
  candles: OandaCandle[];
  instrument: string;
  granularity: string;
}

function getAuthHeaders(token: string): Record<string, string> {
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function oandaTimeframe(tf: string): string {
  return OANDA_TIMEFRAME_MAP[tf] || "H1";
}

function oandaInstrument(symbol: string): string {
  return OANDA_INSTRUMENT_MAP[symbol.toUpperCase()] || symbol.toUpperCase().replace("/", "_").replace("-", "_");
}

function parseOandaCandle(oc: OandaCandle): Candle {
  const mid = oc.mid;
  return {
    timestamp: new Date(oc.time).getTime(),
    open: parseFloat(mid.o),
    high: parseFloat(mid.h),
    low: parseFloat(mid.l),
    close: parseFloat(mid.c),
    volume: oc.volume,
  };
}

export function createOandaProvider(token: string, accountId?: string): MarketDataProvider {
  const headers = getAuthHeaders(token);

  return {
    id: "oanda",
    async getSymbols() {
      return Object.keys(OANDA_INSTRUMENT_MAP);
    },
    getTimeframes() {
      return SUPPORTED_TIMEFRAMES;
    },
    async getHistoricalCandles(symbol, timeframe, start, end) {
      const instrument = oandaInstrument(symbol);
      const granularity = oandaTimeframe(timeframe);
      
      let url = `${OANDA_API_BASE}/instruments/${instrument}/candles?granularity=${granularity}&price=M`;
      
      if (start) url += `&from=${new Date(start).toISOString()}`;
      if (end) url += `&to=${new Date(end).toISOString()}`;
      url += "&count=5000"; // max per request

      const res = await fetch(url, { headers });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`OANDA ${res.status}: ${err}`);
      }
      
      const data: OandaResponse = await res.json();
      const candles = data.candles
        .filter(c => c.complete)
        .map(parseOandaCandle)
        .sort((a, b) => a.timestamp - b.timestamp);

      return {
        candles,
        meta: {
          symbol,
          marketType: "forex",
          timeframe,
          candleCount: candles.length,
          startTime: candles[0]?.timestamp ?? 0,
          endTime: candles[candles.length - 1]?.timestamp ?? 0,
          isDemo: true,
        },
      };
    },
  };
}

export function createOandaStreamProvider(token: string): { 
  subscribe: (instrument: string, onCandle: (candle: Candle) => void) => () => void 
} {
  // For real-time streaming, use WebSocket
  return {
    subscribe: (instrument, onCandle) => {
      const ws = new WebSocket(`${OANDA_STREAM_BASE}/accounts/${instrument}/pricing/stream`);
      ws.onmessage = (event) => {
        // Handle streaming price updates
      };
      return () => ws.close();
    },
  };
}