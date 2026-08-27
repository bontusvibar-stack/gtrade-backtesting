"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function EquityPathsChart({ runs }: { runs: number[][] }) {
  // Sample up to 20 paths + median
  const sampled = runs.slice(0, 20);
  const data = sampled[0]?.map((_, idx) => {
    const row: Record<string, number> = { i: idx };
    sampled.forEach((run, rIdx) => { row[`p${rIdx}`] = run[idx] ?? run[run.length - 1]; });
    return row;
  }) ?? [];

  return (
    <div style={{ height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
          <XAxis dataKey="i" tick={{ fontSize: 10, fill: "#a1a1aa" }} tickLine={false} axisLine={{ stroke: "#27272a" }} />
          <YAxis tick={{ fontSize: 10, fill: "#a1a1aa" }} tickLine={false} axisLine={false} width={70} />
          <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 6, fontSize: 12 }} />
          {sampled.map((_, idx) => (
            <Line key={idx} type="monotone" dataKey={`p${idx}`} stroke={idx === 0 ? "#22c55e" : "rgba(255,255,255,0.08)"} dot={false} strokeWidth={idx === 0 ? 1.5 : 0.7} isAnimationActive={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-white/30">20 sample paths from 1000 shuffled trade sequences — green = first path</p>
    </div>
  );
}
