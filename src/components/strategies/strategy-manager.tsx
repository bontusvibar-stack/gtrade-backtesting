"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface StrategyRow {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  archived: boolean;
  created_at: string;
}

export function StrategyManager({ initial }: { initial: StrategyRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("custom");
  const [filterArchived, setFilterArchived] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = initial.filter((s) => (filterArchived ? true : !s.archived));

  async function createStrategy() {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setBusy("create");
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not signed in.");
      setBusy(null);
      return;
    }
    const { data, error } = await supabase
      .from("strategies")
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: desc.trim() || null,
        category,
      })
      .select("id")
      .single<{ id: string }>();
    if (error) {
      setError(error.message);
      setBusy(null);
      return;
    }
    await supabase.from("strategy_versions").insert({
      strategy_id: data.id,
      user_id: user.id,
      version: 1,
      parameters: {},
      code: null,
    });
    setName("");
    setDesc("");
    setBusy(null);
    router.refresh();
  }

  async function duplicateStrategy(row: StrategyRow) {
    setBusy(row.id);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not signed in.");
      setBusy(null);
      return;
    }
    const { data, error } = await supabase
      .from("strategies")
      .insert({
        user_id: user.id,
        name: row.name + " (copy)",
        description: row.description,
        category: row.category,
      })
      .select("id")
      .single<{ id: string }>();
    if (error) {
      setError(error.message);
      setBusy(null);
      return;
    }
    // copy latest version params
    const { data: ver } = await supabase
      .from("strategy_versions")
      .select("parameters, code")
      .eq("strategy_id", row.id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle<{ parameters: Record<string, unknown>; code: string | null }>();
    await supabase.from("strategy_versions").insert({
      strategy_id: data.id,
      user_id: user.id,
      version: 1,
      parameters: ver?.parameters ?? {},
      code: ver?.code ?? null,
    });
    setBusy(null);
    router.refresh();
  }

  async function toggleArchive(row: StrategyRow) {
    setBusy(row.id);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("strategies")
      .update({ archived: !row.archived })
      .eq("id", row.id);
    if (error) setError(error.message);
    setBusy(null);
    router.refresh();
  }

  async function newVersion(row: StrategyRow) {
    const raw = window.prompt(
      "New version parameters as JSON (e.g. {\"fast\":10,\"slow\":30}):",
      "{}",
    );
    if (raw === null) return;
    let params: Record<string, unknown>;
    try {
      params = JSON.parse(raw);
    } catch {
      setError("Invalid JSON.");
      return;
    }
    setBusy(row.id);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not signed in.");
      setBusy(null);
      return;
    }
    const { data: vers } = await supabase
      .from("strategy_versions")
      .select("version")
      .eq("strategy_id", row.id)
      .order("version", { ascending: false })
      .limit(1);
    const next = (vers?.[0]?.version ?? 0) + 1;
    const { error } = await supabase.from("strategy_versions").insert({
      strategy_id: row.id,
      user_id: user.id,
      version: next,
      parameters: params,
      code: null,
    });
    if (error) setError(error.message);
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Create */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">New strategy</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Description"
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="custom">custom</option>
            <option value="sma_crossover">sma_crossover</option>
            <option value="rsi">rsi</option>
            <option value="breakout">breakout</option>
          </select>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={createStrategy}
            disabled={!!busy}
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            Create
          </button>
          {error && <span className="text-xs text-destructive">{error}</span>}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Engine ships with 3 demo strategies (sma_crossover, rsi_threshold, breakout) usable
          immediately from the Backtest page. Create your own for versioned, reusable configs.
        </p>
      </div>

      {/* List */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Your strategies ({visible.length})</h2>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={filterArchived}
            onChange={(e) => setFilterArchived(e.target.checked)}
            className="h-3 w-3"
          />
          Show archived
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">No strategies yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map((s) => (
            <div
              key={s.id}
              className={`rounded-lg border p-3 ${s.archived ? "border-border/60 bg-card/60 opacity-70" : "border-border bg-card"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.category ?? "custom"} · {s.archived ? "archived" : "active"} ·{" "}
                    {new Date(s.created_at).toISOString().slice(0, 10)}
                  </p>
                  {s.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <button
                  onClick={() => duplicateStrategy(s)}
                  disabled={!!busy}
                  className="rounded border border-border px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
                >
                  Duplicate
                </button>
                <button
                  onClick={() => newVersion(s)}
                  disabled={!!busy}
                  className="rounded border border-border px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
                >
                  New version
                </button>
                <button
                  onClick={() => toggleArchive(s)}
                  disabled={!!busy}
                  className="rounded border border-border px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
                >
                  {s.archived ? "Unarchive" : "Archive"}
                </button>
                {busy === s.id && (
                  <span className="text-xs text-muted-foreground">Working…</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
