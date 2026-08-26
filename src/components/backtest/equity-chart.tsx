"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { EquityPoint } from "@/types/backtesting";

interface EquityChartProps {
  points: EquityPoint[];
  height?: number;
}

export function EquityChart({ points, height = 220 }: EquityChartProps) {
  const data = points.map((p) => ({
    time: new Date(p.timestamp).toISOString().slice(0, 10),
    equity: p.equity,
    drawdownPct: -p.drawdownPct,
  }));

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: "#a1a1aa" }}
            tickLine={false}
            axisLine={{ stroke: "#27272a" }}
            minTickGap={40}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#a1a1aa" }}
            tickLine={false}
            axisLine={false}
            width={60}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              background: "#18181b",
              border: "1px solid #27272a",
              borderRadius: 6,
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="equity"
            stroke="#22c55e"
            fill="rgba(34,197,94,0.12)"
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DrawdownChart({ points, height = 140 }: EquityChartProps) {
  const data = points.map((p) => ({
    time: new Date(p.timestamp).toISOString().slice(0, 10),
    dd: -p.drawdownPct,
  }));

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: "#a1a1aa" }}
            tickLine={false}
            axisLine={{ stroke: "#27272a" }}
            minTickGap={40}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#a1a1aa" }}
            tickLine={false}
            axisLine={false}
            width={60}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              background: "#18181b",
              border: "1px solid #27272a",
              borderRadius: 6,
              fontSize: 12,
            }}
            formatter={(value) => [`${value}%`, "Drawdown"]}
          />
          <Area
            type="monotone"
            dataKey="dd"
            stroke="#ef4444"
            fill="rgba(239,68,68,0.15)"
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
