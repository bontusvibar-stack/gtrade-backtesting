"use client";

import jsPDF from "jspdf";
import type { Trade } from "@/types/backtesting";
import type { MetricsResult } from "@/lib/calculations/metrics";

export function exportBacktestPdf(opts: {
  symbol: string;
  timeframe: string;
  config: unknown;
  metrics: MetricsResult;
  trades: Trade[];
}) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`GTrade Backtest Report — ${opts.symbol} ${opts.timeframe}`, 10, 15);
  doc.setFontSize(9);
  doc.text(`Generated ${new Date().toISOString()} — Historical backtesting does not guarantee future performance.`, 10, 22);
  doc.setFontSize(11);
  doc.text("Performance", 10, 30);
  doc.setFontSize(9);
  const m = opts.metrics as unknown as Record<string, number>;
  const lines = [
    `Net P&L: ${m.netProfit?.toFixed?.(2)}  Return: ${m.totalReturn?.toFixed?.(2)}%  WinRate: ${m.winRate?.toFixed?.(1)}%`,
    `Profit Factor: ${m.profitFactor?.toFixed?.(2)}  Expectancy: ${m.expectancy?.toFixed?.(2)}  Trades: ${m.tradeCount}`,
    `Max DD: ${m.maxDrawdown?.toFixed?.(2)} (${m.maxDrawdownPct?.toFixed?.(1)}%)  Sharpe: ${m.sharpe?.toFixed?.(2)}  Sortino: ${m.sortino?.toFixed?.(2)}`,
  ];
  lines.forEach((l, i) => doc.text(l, 10, 36 + i * 6));
  doc.text("Trades (first 20)", 10, 58);
  let y = 64;
  doc.setFontSize(7);
  doc.text("id side entry exit qty net R reason", 10, y);
  y += 5;
  opts.trades.slice(0, 20).forEach((t) => {
    if (y > 280) { doc.addPage(); y = 15; }
    doc.text(`${String(t.id).slice(0, 6)} ${t.side} ${t.entryPrice} ${t.exitPrice ?? "-"} ${t.quantity} ${t.netPnl.toFixed(2)} ${t.rMultiple.toFixed(2)} ${t.exitReason ?? ""}`, 10, y);
    y += 5;
  });
  if (opts.trades.length > 20) {
    doc.text(`... ${opts.trades.length} total`, 10, y + 2);
  }
  doc.save(`report-${opts.symbol}-${Date.now()}.pdf`);
}
