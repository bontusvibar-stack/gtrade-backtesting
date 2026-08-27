"use client";

import { useState } from "react";
import type { Condition, ConditionGroup, LogicOp, Operator } from "@/lib/strategy-builder/types";
import { evaluateRule } from "@/lib/strategy-builder/engine";
import type { Candle } from "@/types/backtesting";

function uid() { return Math.random().toString(36).slice(2, 7); }

const defaultCond = (): Condition => ({
  id: uid(),
  left: { type: "price", ref: "close" },
  operator: ">" as Operator,
  right: { type: "indicator", ref: "SMA_20", param: 20 },
});

export function StrategyBuilder({ candles, onUseStrategy }: { candles?: Candle[]; onUseStrategy?: (rule: ConditionGroup) => void }) {
  const [group, setGroup] = useState<ConditionGroup>({ id: "root", logic: "AND", conditions: [defaultCond()] });
  const [logic, setLogic] = useState<LogicOp>("AND");
  const [preview, setPreview] = useState<string>("");
  const [saved, setSaved] = useState<string | null>(null);

  function addCondition() {
    setGroup((g) => ({ ...g, conditions: [...g.conditions, defaultCond()], logic }));
  }
  function updateLogic(l: LogicOp) {
    setLogic(l);
    setGroup((g) => ({ ...g, logic: l }));
  }
  function remove(id: string) {
    setGroup((g) => ({ ...g, conditions: g.conditions.filter((c) => (c as Condition).id !== id) }));
  }
  function runPreview() {
    if (!candles || candles.length === 0) {
      setPreview("No candles loaded — load dataset in Backtest first or import CSV.");
      return;
    }
    const rule = { id: "preview", name: "Preview", entry: group };
    let hits = 0;
    for (let i = 20; i < candles.length; i++) {
      const { entry } = evaluateRule(candles, i, rule as never);
      if (entry) hits++;
    }
    setPreview(`Signals: ${hits} / ${candles.length} candles (${((hits / candles.length) * 100).toFixed(1)}%)`);
  }

  async function saveAndUse() {
    const name = prompt("Name for custom strategy:", `Custom ${new Date().toISOString().slice(0, 10)}`);
    if (!name) return;
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { data: strat, error } = await supabase.from("strategies").insert({ user_id: user.id, name, description: `Builder: ${group.conditions.length} conditions (${logic})`, category: "custom" }).select("id").single<{ id: string }>();
      if (error) throw new Error(error.message);
      await supabase.from("strategy_versions").insert({ strategy_id: strat.id, user_id: user.id, version: 1, parameters: { builder: group }, code: JSON.stringify(group) });
      setSaved(`Saved ${name} — now selectable via Strategy dropdown (refresh Backtest).`);
      if (onUseStrategy) onUseStrategy(group);
      // Store locally for immediate use in Backtest via localStorage
      localStorage.setItem("gtrade_custom_builder", JSON.stringify({ name, group }));
    } catch (e) {
      setSaved(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-white/[0.07] bg-[#151515] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Visual Strategy Builder</h3>
        <div className="flex gap-1">
          <button onClick={() => updateLogic("AND")} className={`rounded px-2 py-1 text-xs ${logic === "AND" ? "bg-white text-black" : "border border-white/10 text-white/60"}`}>AND</button>
          <button onClick={() => updateLogic("OR")} className={`rounded px-2 py-1 text-xs ${logic === "OR" ? "bg-white text-black" : "border border-white/10 text-white/60"}`}>OR</button>
        </div>
      </div>
      <p className="text-xs text-white/40">Build IF/THEN rules. Supports nested AND/OR/NOT, cross above/below. Example: IF EMA20 &gt; EMA50 AND RSI &gt; 50 THEN BUY.</p>
      <div className="space-y-2">
        {group.conditions.map((c) => {
          const cond = c as Condition;
          return (
            <div key={cond.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-2">
              <select value={cond.left.ref} onChange={(e) => { cond.left.ref = e.target.value; setGroup({ ...group }); }} className="rounded bg-white/[0.06] px-2 py-1 text-xs text-white">
                <option value="close">close</option>
                <option value="open">open</option>
                <option value="SMA_20">SMA20</option>
                <option value="EMA_20">EMA20</option>
                <option value="RSI_14">RSI14</option>
                <option value="ATR_14">ATR14</option>
                <option value="CCI_20">CCI20</option>
              </select>
              <select value={cond.operator} onChange={(e) => { cond.operator = e.target.value as Operator; setGroup({ ...group }); }} className="rounded bg-white/[0.06] px-2 py-1 text-xs text-white">
                <option value=">">&gt;</option>
                <option value="<">&lt;</option>
                <option value=">=">&gt;=</option>
                <option value="<=">&lt;=</option>
                <option value="cross_above">cross above</option>
                <option value="cross_below">cross below</option>
              </select>
              <select value={cond.right.ref} onChange={(e) => { cond.right.ref = e.target.value; setGroup({ ...group }); }} className="rounded bg-white/[0.06] px-2 py-1 text-xs text-white">
                <option value="SMA_20">SMA20</option>
                <option value="SMA_50">SMA50</option>
                <option value="EMA_50">EMA50</option>
                <option value="RSI_14">RSI14</option>
                <option value="50">50 (value)</option>
                <option value="close">close</option>
              </select>
              <label className="flex items-center gap-1 text-xs text-white/60"><input type="checkbox" checked={!!cond.not} onChange={(e) => { cond.not = e.target.checked; setGroup({ ...group }); }} /> NOT</label>
              <button onClick={() => remove(cond.id)} className="ml-auto text-xs text-red-400">x</button>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button onClick={addCondition} className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/70">+ Add condition</button>
        <button onClick={runPreview} className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-black">Preview signals</button>
        <button onClick={saveAndUse} className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white">Save & Use Live</button>
        <button onClick={() => navigator.clipboard.writeText(JSON.stringify(group, null, 2))} className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/50">Copy JSON</button>
      </div>
      {preview && <p className="text-xs text-emerald-300">{preview}</p>}
      {saved && <p className="text-xs text-amber-300">{saved}</p>}
      <details className="text-xs text-white/30"><summary>JSON</summary><pre className="mt-1 overflow-auto rounded bg-black/30 p-2 text-[11px]">{JSON.stringify(group, null, 2)}</pre></details>
    </div>
  );
}
