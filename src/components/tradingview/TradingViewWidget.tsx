"use client";

import { useEffect, useRef } from "react";

interface Props {
  symbol?: string;
  interval?: string;
  theme?: "light" | "dark";
  timezone?: string;
  height?: number;
}

export function TradingViewWidget({ symbol = "OANDA:XAUUSD", interval = "15", theme = "dark", timezone = "Asia/Jakarta", height = 520 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s-cdn.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      // @ts-expect-error tv global
      const tv = window.TradingView;
      if (!tv) return;
      new tv.widget({
        autosize: true,
        symbol,
        interval,
        timezone,
        theme,
        style: "1",
        locale: "en",
        toolbar_bg: "#0f0f0f",
        enable_publishing: false,
        hide_top_toolbar: false,
        allow_symbol_change: true,
        container_id: ref.current!.id,
        backgroundColor: "#0a0a0a",
        gridColor: "rgba(255,255,255,0.06)",
      });
    };
    document.head.appendChild(script);
    return () => {
      try { script.remove(); } catch {}
      if (ref.current) ref.current.innerHTML = "";
    };
  }, [symbol, interval, theme, timezone]);

  return <div id={`tv_${symbol.replace(/[^A-Z0-9]/g, "")}_${interval}`} ref={ref} style={{ height }} className="w-full rounded-xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden" />;
}
