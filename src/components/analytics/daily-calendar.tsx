"use client";

interface DayPnl { date: string; pnl: number }

export function DailyCalendar({ days }: { days: DayPnl[] }) {
  const map = new Map(days.map((d) => [d.date, d.pnl]));
  // Show last 90 days grid
  const today = new Date();
  const cells: { date: string; pnl: number | null }[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    cells.push({ date: key, pnl: map.get(key) ?? null });
  }
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-[10px] text-muted-foreground"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((c) => {
          const color = c.pnl === null ? "bg-white/[0.04] border-white/[0.06]" : c.pnl > 0 ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" : c.pnl < 0 ? "bg-red-500/20 border-red-500/30 text-red-300" : "bg-white/[0.04]";
          return <div key={c.date} title={`${c.date}: ${c.pnl ?? "no trade"}`} className={`h-8 rounded border p-1 text-[10px] ${color}`}>{c.date.slice(8)}<br/>{c.pnl !== null ? c.pnl.toFixed(0) : ""}</div>;
        })}
      </div>
      <p className="mt-1 text-[10px] text-white/30">Green = profit, red = loss, gray = no trade</p>
    </div>
  );
}
