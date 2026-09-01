"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export function AlertBuilder({ webhookUrl }: { webhookUrl: string }) {
  const [symbol, setSymbol] = useState("XAUUSD");
  const [condition, setCondition] = useState("EMA Cross");
  const [timeframe, setTimeframe] = useState("M15");
  const [action, setAction] = useState<"BUY" | "SELL">("BUY");
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const [strategy, setStrategy] = useState("");

  const webhookExample = JSON.stringify({ secret: "GTRADE_SECRET", symbol, action, price: "{{close}}", timeframe: timeframe.replace("M", ""), strategy: strategy || "EMA_CROSS", timestamp: "{{timenow}}", stopLoss: sl || undefined, takeProfit: tp || undefined }, null, 2);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#151515] p-4 space-y-3">
      <h3 className="text-sm font-semibold text-white">CREATE ALERT</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-xs text-white/60">Symbol
          <select value={symbol} onChange={e => setSymbol(e.target.value)} className="mt-1 w-full rounded-lg bg-white/[0.06] border border-white/10 px-3 py-2 text-sm text-white">
            <option>XAUUSD</option><option>BTCUSD</option><option>EURUSD</option><option>GBPUSD</option><option>NAS100_USD</option>
          </select>
        </label>
        <label className="text-xs text-white/60">Condition
          <select value={condition} onChange={e => setCondition(e.target.value)} className="mt-1 w-full rounded-lg bg-white/[0.06] border border-white/10 px-3 py-2 text-sm text-white">
            <option>EMA Cross</option><option>RSI Overbought</option><option>MACD Cross</option>
          </select>
        </label>
        <label className="text-xs text-white/60">Timeframe
          <select value={timeframe} onChange={e => setTimeframe(e.target.value)} className="mt-1 w-full rounded-lg bg-white/[0.06] border border-white/10 px-3 py-2 text-sm text-white">
            <option>M15</option><option>M1</option><option>M5</option><option>H1</option><option>H4</option><option>D1</option>
          </select>
        </label>
        <label className="text-xs text-white/60">Action
          <select value={action} onChange={e => setAction(e.target.value as never)} className="mt-1 w-full rounded-lg bg-white/[0.06] border border-white/10 px-3 py-2 text-sm text-white">
            <option>BUY</option><option>SELL</option>
          </select>
        </label>
        <label className="text-xs text-white/60">Stop Loss<input value={sl} onChange={e => setSl(e.target.value)} placeholder="3418.50" className="mt-1 w-full rounded-lg bg-white/[0.06] border border-white/10 px-3 py-2 text-sm" /></label>
        <label className="text-xs text-white/60">Take Profit<input value={tp} onChange={e => setTp(e.target.value)} placeholder="3440.00" className="mt-1 w-full rounded-lg bg-white/[0.06] border border-white/10 px-3 py-2 text-sm" /></label>
      </div>
      <label className="text-xs text-white/60">Strategy<input value={strategy} onChange={e => setStrategy(e.target.value)} placeholder="EMA_CROSS" className="mt-1 w-full rounded-lg bg-white/[0.06] border border-white/10 px-3 py-2 text-sm" /></label>

      <div className="rounded-lg bg-black/40 p-3">
        <p className="text-[11px] tracking-widest text-white/40">WEBHOOK URL (set in TradingView Alert)</p>
        <code className="mt-1 block break-all text-xs font-mono text-amber-300">{webhookUrl}</code>
        <p className="mt-3 text-[11px] tracking-widest text-white/40">MESSAGE (paste in TradingView Alert Message)</p>
        <pre className="mt-1 overflow-auto rounded bg-white/[0.04] p-2 text-xs font-mono text-white/80">{webhookExample}</pre>
        <p className="mt-2 text-xs text-white/30">In TradingView: Create Alert → Condition: your Pine Script alertcondition → Options: Webhook URL → paste above → Message → paste JSON.</p>
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer text-white/60">Pine Script example</summary>
        <pre className="mt-2 overflow-auto rounded bg-white/[0.04] p-3 font-mono text-xs text-white/70">{`//@version=6
indicator("Gtrade Signal", overlay=true)
fastMA = ta.ema(close, 9)
slowMA = ta.ema(close, 21)
buySignal = ta.crossover(fastMA, slowMA)
sellSignal = ta.crossunder(fastMA, slowMA)
plot(fastMA)
plot(slowMA)
alertcondition(buySignal, title="Gtrade BUY", message='{"secret":"GTRADE_SECRET","symbol":"XAUUSD","action":"BUY","price":{{close}},"timeframe":"15","strategy":"EMA_CROSS"}')
alertcondition(sellSignal, title="Gtrade SELL", message='{"secret":"GTRADE_SECRET","symbol":"XAUUSD","action":"SELL","price":{{close}},"timeframe":"15","strategy":"EMA_CROSS"}')`}</pre>
      </details>
    </div>
  );
}
