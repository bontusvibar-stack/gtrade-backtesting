import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: Props) {
  const { id } = await params;
  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "json";
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: run, error } = await supabase
    .from("backtest_runs")
    .select("id, created_at, engine_version, backtest_configs(*), backtest_results(*)")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .single();
  if (error || !run) return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 404 });

  const { data: trades } = await supabase.from("trades").select("*").eq("backtest_run_id", id).order("entry_time");
  const { data: equity } = await supabase.from("equity_points").select("*").eq("backtest_run_id", id).order("timestamp");
  const payload = { run, trades: trades ?? [], equity: equity ?? [], exportedAt: new Date().toISOString(), schemaVersion: 1 };

  if (format === "csv") {
    const header = "id,symbol,side,entry_time,exit_time,entry_price,exit_price,quantity,gross_pnl,commission,slippage,net_pnl,r_multiple,exit_reason";
    const rows = (trades ?? []).map((t: Record<string, unknown>) => ["id", "symbol", "side", "entry_time", "exit_time", "entry_price", "exit_price", "quantity", "gross_pnl", "commission", "slippage", "net_pnl", "r_multiple", "exit_reason"].map((k) => String(t[k] ?? "")).join(","));
    return new Response([header, ...rows].join("\n"), { headers: { "content-type": "text/csv", "content-disposition": `attachment; filename="backtest-${id}.csv"` } });
  }
  if (format === "report") {
    const cfg = (run.backtest_configs?.[0] ?? {}) as Record<string, unknown>;
    const res = (run.backtest_results?.[0] ?? {}) as Record<string, unknown>;
    const html = `<!doctype html><html><body><h1>GTrade Backtest Report ${id}</h1><p>${cfg.symbol ?? ""} ${cfg.timeframe ?? ""} · engine ${run.engine_version}</p><h2>Metrics</h2><pre>${JSON.stringify(res.metrics ?? res, null, 2)}</pre><h2>Configuration</h2><pre>${JSON.stringify(cfg, null, 2)}</pre><h2>Trades</h2><pre>${JSON.stringify(trades ?? [], null, 2)}</pre><p>Historical backtesting does not guarantee future performance.</p></body></html>`;
    return new Response(html, { headers: { "content-type": "text/html" } });
  }
  return NextResponse.json(payload);
}
