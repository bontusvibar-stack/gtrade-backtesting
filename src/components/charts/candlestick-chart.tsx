"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  createSeriesMarkers,
  type IChartApi,
  type Time,
  type UTCTimestamp,
  type SeriesMarker,
  type SeriesType,
} from "lightweight-charts";
import type { Candle, Trade } from "@/types/backtesting";

interface CandlestickChartProps {
  candles: Candle[];
  trades?: Trade[];
  height?: number;
}

function toChartCandles(candles: Candle[]) {
  return candles.map((c) => ({
    time: (c.timestamp / 1000) as UTCTimestamp,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }));
}

function tradeMarkers(trades: Trade[]): SeriesMarker<Time>[] {
  const markers: SeriesMarker<Time>[] = [];
  for (const t of trades) {
    markers.push({
      time: (t.entryTime / 1000) as UTCTimestamp,
      position: t.side === "buy" ? "belowBar" : "aboveBar",
      color: t.side === "buy" ? "#22c55e" : "#ef4444",
      shape: t.side === "buy" ? "arrowUp" : "arrowDown",
      text: `${t.side === "buy" ? "B" : "S"} ${t.id}`,
    });
    if (t.exitTime !== null && t.exitPrice !== null) {
      const win = (t.netPnl ?? 0) >= 0;
      markers.push({
        time: (t.exitTime / 1000) as UTCTimestamp,
        position: t.side === "buy" ? "aboveBar" : "belowBar",
        color: win ? "#22c55e" : "#ef4444",
        shape: t.side === "buy" ? "arrowDown" : "arrowUp",
        text: `X ${t.exitReason ?? ""}`,
      });
    }
  }
  return markers;
}

export function CandlestickChart({
  candles,
  trades = [],
  height = 420,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      height,
      layout: {
        background: { color: "transparent" },
        textColor: "#a1a1aa",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.05)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      timeScale: { timeVisible: true, borderColor: "#27272a" },
      rightPriceScale: { borderColor: "#27272a" },
      crosshair: { mode: 1 },
    });
    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });
    candleSeries.setData(toChartCandles(candles));

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
    });
    chart.priceScale("vol").applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });
    volumeSeries.setData(
      candles.map((c) => ({
        time: (c.timestamp / 1000) as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)",
      })),
    );

    if (trades.length > 0) {
      createSeriesMarkers(candleSeries as never, tradeMarkers(trades));
    }

    chart.timeScale().fitContent();

    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) chart.applyOptions({ width: Math.floor(w) });
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [candles, trades, height]);

  return <div ref={containerRef} className="w-full" style={{ height }} />;
}
