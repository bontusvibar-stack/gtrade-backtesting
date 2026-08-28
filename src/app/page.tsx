"use client";
import { motion, useScroll, useTransform, useVelocity, useSpring, useMotionValue, useAnimationFrame } from "framer-motion";
import { useRef } from "react";
import { APP_NAME } from "@/config";
import { Rocket, Star, Code2, Terminal, BarChart3, TrendingUp, Zap, Shield, Boxes } from "lucide-react";

// Helper: skew on velocity
function useSkew() {
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const skew = useTransform(velocity, [-1000, 1000], [-8, 8]);
  const smoothSkew = useSpring(skew, { stiffness: 300, damping: 30 });
  return smoothSkew;
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

function ParallaxLayer({ offset, children }: { offset: number; children: React.ReactNode }) {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, offset]);
  return <motion.div style={{ y }}>{children}</motion.div>;
}

export default function HomePage() {
  const skew = useSkew();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const scaleHero = useTransform(scrollYProgress, [0, 0.3], [1, 1.15]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const horizontalX = useTransform(scrollYProgress, [0.5, 0.75], ["0%", "-60%"]);
  const pinnedScale = useTransform(scrollYProgress, [0.75, 0.92], [0.9, 1]);

  return (
    <div ref={containerRef} className="relative bg-[#060a07] text-white overflow-clip">
      {/* GREEN PROGRAMMER BACKGROUND */}
      <div className="fixed inset-0 -z-10 bg-[#050a06]">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/40 via-[#060a07] to-[#050a06]" />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, #10b981 2px, #10b981 3px)`, backgroundSize: "100% 8px" }} />
        {/* code rain */}
        <div className="absolute inset-0 opacity-[0.04] text-emerald-400 font-mono text-[10px] leading-[14px] p-4 overflow-hidden select-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="whitespace-nowrap">{`const backtest = await engine.run(candles); // G-Backtest v0.2.0  `} {`EMA20 > EMA50 && RSI>50 => BUY  `} {`equity = balance + unrealizedPnL`}</div>
          ))}
        </div>
      </div>

      {/* STARS */}
      <ParallaxLayer offset={-120}>
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-emerald-300"
              style={{ left: `${(i * 37) % 100}%`, top: `${(i * 57) % 100}%` }}
              animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.4, 1] }}
              transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.08 }}
            />
          ))}
        </div>
      </ParallaxLayer>

      {/* BANNER LOGO */}
      <motion.div style={{ skewX: skew }} className="relative z-10 border-b border-emerald-900/30 bg-emerald-950/20 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 shadow-lg shadow-emerald-900/30">
              <Terminal className="h-5 w-5 text-black" />
            </div>
            <span className="text-sm font-black tracking-widest text-emerald-300">G-BACKTEST</span>
            <span className="hidden rounded-full border border-emerald-800 bg-emerald-900/30 px-2 py-0.5 text-[10px] tracking-widest text-emerald-300 md:inline">PROGRAMMER EDITION</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="hidden text-emerald-300/60 md:inline">v0.2.0 • Next.js 16 + Supabase</span>
            <a href="/dashboard" className="rounded-full bg-emerald-500 px-4 py-1.5 font-semibold text-black hover:bg-emerald-400 transition">Launch Terminal</a>
          </div>
        </div>
      </motion.div>

      {/* HERO — parallax + scale on scroll + rocket */}
      <section className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col items-center justify-center px-6 text-center">
        <motion.div style={{ scale: scaleHero, opacity: opacityHero }} className="relative">
          <ParallaxLayer offset={-60}>
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-10 -top-8 hidden md:block">
              <Rocket className="h-10 w-10 text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
            </motion.div>
          </ParallaxLayer>
          <Reveal>
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-emerald-800 bg-emerald-950/40 px-3 py-1 text-xs text-emerald-300">
              <Star className="h-3 w-3" /> Correctness {">"} Data Integrity {">"} Engine {">"} UI Polish
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-4 bg-gradient-to-b from-white to-white/60 bg-clip-text text-5xl font-black tracking-tighter text-transparent md:text-7xl">
              {APP_NAME} <span className="bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">BACKTEST</span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/60 md:text-base">Bukan mockup — engine deterministik, no look-ahead bias, margin/leverage, spread/slippage/swap, 15 indikator, Web Worker, Monte Carlo & walk-forward. Terminal-grade.</p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-6 flex justify-center gap-3">
              <a href="/dashboard" className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-bold text-black hover:bg-emerald-400 transition shadow-[0_0_20px_rgba(16,185,129,0.5)]">Open Dashboard →</a>
              <a href="/backtest" className="rounded-full border border-white/10 bg-white/[0.06] px-6 py-2.5 text-sm font-medium backdrop-blur hover:bg-white/10">Run Backtest</a>
            </div>
          </Reveal>
          <Reveal delay={0.32}>
            <div className="mt-6 flex flex-wrap justify-center gap-2 text-[10px] tracking-widest text-white/30">
              {["React + TS + Vite", "Tailwind + shadcn", "Lightweight Charts", "Recharts", "Framer Motion", "Zustand", "Supabase", "Web Worker"].map((s) => (
                <span key={s} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">{s}</span>
              ))}
            </div>
          </Reveal>
        </motion.div>
      </section>

      {/* VELOCITY SCROLL MARQUEE */}
      <div className="border-y border-emerald-900/20 bg-emerald-950/10 py-3">
        <VelocityStrip text="G-BACKTEST  •  NO LOOK-AHEAD BIAS  •  NEXT CANDLE OPEN  •  ATR x2 SL  •  SWAP & FUNDING  •  MARGIN CALL" />
      </div>

      {/* SCROLL REVEAL FEATURES */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <Reveal><h2 className="text-2xl font-bold tracking-tight">18 Halaman • Terminal Layout • 15 Indikator</h2></Reveal>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { icon: Terminal, title: "Backtest Workspace", desc: "LEFT config • CENTER chart • RIGHT order/position • BOTTOM trades/logs" },
            { icon: Code2, title: "Strategy Builder", desc: "IF EMA20 > EMA50 AND RSI>50 THEN BUY • AND/OR/NOT nested" },
            { icon: BarChart3, title: "Analytics", desc: "Equity, drawdown, monthly, daily calendar, win/loss dist" },
            { icon: TrendingUp, title: "Order Engine", desc: "Market/Limit/Stop/Stop-Limit • pending/filled/partial/cancelled" },
            { icon: Shield, title: "Risk Engine", desc: "Max daily/weekly, drawdown, consec losses, margin level" },
            { icon: Boxes, title: "Monte Carlo", desc: "Resample trade outcomes • median/best/worst • tidak menjamin profit" },
          ].map((f, i) => (
            <Reveal key={f.title} delay={i * 0.06}>
              <div className="group rounded-xl border border-white/[0.07] bg-[#0f1410] p-4 hover:border-emerald-800/50 hover:bg-emerald-950/20 transition">
                <f.icon className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition" />
                <p className="mt-2 text-sm font-semibold">{f.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* HORIZONTAL SCROLL — vertical scroll drives horizontal */}
      <section className="relative h-[60vh] overflow-hidden border-y border-emerald-900/20 bg-black/20">
        <div className="sticky top-0 flex h-[60vh] items-center overflow-hidden">
          <motion.div style={{ x: horizontalX }} className="flex gap-4 pl-6">
            {["XAUUSD 1m", "EURUSD 15m", "BTCUSD 1H", "NASDAQ 4H", "SPX 1D", "ETHUSD 1W"].map((s) => (
              <div key={s} className="h-44 w-[280px] shrink-0 rounded-xl border border-emerald-900/30 bg-gradient-to-br from-emerald-950/40 to-black p-4">
                <p className="text-xs tracking-widest text-emerald-300/60">{s}</p>
                <div className="mt-3 h-20 rounded bg-gradient-to-r from-emerald-500/20 to-transparent" />
                <p className="mt-2 text-xs text-white/40">Dataset CSV validated • no duplicates • no gaps</p>
              </div>
            ))}
          </motion.div>
        </div>
        <p className="absolute bottom-3 left-6 text-xs text-white/30">→ Scroll untuk gerakkan horizontal (horizontal scroll)</p>
      </section>

      {/* PINNED SECTION */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <Reveal><h2 className="text-2xl font-bold">Pinned Terminal — indikator real</h2></Reveal>
        </div>
        <div className="sticky top-[60px] mx-auto flex max-w-6xl gap-4 px-6 pb-8">
          <motion.div style={{ scale: pinnedScale }} className="flex-1 rounded-xl border border-emerald-900/30 bg-[#0f1410] p-4">
            <p className="text-xs font-mono text-emerald-300">SMA EMA WMA VWAP RSI MACD BB ATR Stochastic ADX CCI ROC Momentum Supertrend PSAR</p>
            <div className="mt-3 h-48 rounded bg-gradient-to-br from-emerald-500/10 via-transparent to-green-500/10 border border-white/5 flex items-center justify-center">
              <span className="text-xs text-white/30">Candlestick + volume • entry/exit markers • SL/TP • zoom/pan</span>
            </div>
          </motion.div>
          <div className="hidden w-[280px] flex-col gap-3 md:flex">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs">Order panel • BUY/SELL • SL = ATR x2 • TP = ATR x4</div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs">Account: Balance + Unrealized = Equity • Margin Level</div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-16 text-xs leading-relaxed text-white/40">
          {Array.from({ length: 6 }).map((_, i) => (
            <p key={i} className="mt-3">Engine flow: Validate → Indicators → Signal → Risk → Spread/Slippage → Execution → Position → PnL → Equity. No future leakage.</p>
          ))}
        </div>
      </section>

      {/* OVERLAPPING + SCALE ON SCROLL */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <Reveal><h2 className="text-2xl font-bold">Overlapping & Scale on Scroll</h2></Reveal>
        <div className="relative mt-6 h-[420px]">
          {[
            { t: "Trade List", c: "Trade ID, symbol, side, entry/exit, qty, SL/TP, swap, gross/net, R" },
            { t: "Equity Curve", c: "Balance + unrealized • drawdown • benchmark • underwater" },
            { t: "Performance Analytics", c: "Monthly table • daily calendar green/red • long/short • by hour/weekday" },
          ].map((card, i) => (
            <motion.div
              key={card.t}
              initial={{ y: 40, scale: 0.9 }}
              whileInView={{ y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              style={{ zIndex: 3 - i }}
              className="absolute left-0 right-0 mx-auto w-[90%] rounded-xl border border-emerald-900/30 bg-[#0f1410] p-6 shadow-xl"
              animate={{ y: i * 18 }}
            >
              <p className="text-sm font-semibold text-emerald-300">{card.t}</p>
              <p className="mt-1 text-xs text-white/50">{card.c}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SKEW ON VELOCITY DEMO */}
      <motion.section style={{ skewX: skew }} className="mx-auto max-w-6xl px-6 py-12">
        <Reveal><h2 className="text-2xl font-bold">Skew on Velocity — miring saat scroll cepat</h2></Reveal>
        <p className="mt-2 text-sm text-white/50">Scroll cepat → judul miring mengikuti kecepatan (velocity scroll).</p>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {["Optimization Grid", "Walk-Forward IS/OOS", "Risk Management"].map((t) => (
            <div key={t} className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm">{t}</div>
          ))}
        </div>
      </motion.section>

      {/* CTA */}
      <Reveal>
        <section className="mx-auto max-w-6xl px-6 py-16 text-center">
          <a href="/dashboard" className="inline-block rounded-full bg-emerald-500 px-8 py-3 font-bold text-black hover:bg-emerald-400 transition shadow-[0_0_30px_rgba(16,185,129,0.6)]">Launch G-Backtest Terminal →</a>
          <p className="mt-3 text-xs text-white/30">Dark default • Supabase RLS • Web Worker • Correctness {">"} UI polish</p>
        </section>
      </Reveal>
    </div>
  );
}

function VelocityStrip({ text }: { text: string }) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { damping: 50, stiffness: 400 });
  const factor = useTransform(smooth, [0, 1200], [0, 4], { clamp: false });
  const dir = useRef(1);
  useAnimationFrame((_, delta) => {
    let mv = dir.current * 1.2 * (delta / 1000);
    const f = factor.get();
    if (f < 0) dir.current = -1;
    else if (f > 0) dir.current = 1;
    mv += dir.current * mv * f * 0.6;
    baseX.set(baseX.get() + mv);
  });
  const x = useTransform(baseX, (v) => `${((v % 100) + 100) % 100 - 50}%`);
  return (
    <div className="overflow-hidden whitespace-nowrap">
      <motion.div style={{ x }} className="flex gap-8 font-mono text-xs tracking-widest text-emerald-300/70">
        <span>{text} • </span><span>{text} • </span><span>{text} • </span>
      </motion.div>
    </div>
  );
}
