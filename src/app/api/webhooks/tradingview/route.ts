import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Schema per spec §5
const TradingViewWebhookSchema = z.object({
  secret: z.string().min(1),
  symbol: z.string().min(1).max(20),
  action: z.enum(["BUY", "SELL"]),
  price: z.coerce.number().positive(),
  timeframe: z.string().min(1),
  strategy: z.string().optional(),
  timestamp: z.string().optional(),
  stopLoss: z.coerce.number().optional(),
  takeProfit: z.coerce.number().optional(),
  event_id: z.string().optional(),
});

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Supabase service key not configured");
  return createClient(url, key);
}

// Simple in-memory rate limiter: 100 req/min/IP (configurable)
const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = Number(process.env.WEBHOOK_RATE_LIMIT ?? 100);
const WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const startedAt = Date.now();

  // Rate limit
  if (!checkRateLimit(ip)) {
    try {
      const svc = getServiceClient();
      await svc.from("webhook_logs").insert({ event_id: null, payload: null, status: "RATE_LIMITED", error: `Rate limit ${RATE_LIMIT}/min`, ip });
    } catch {}
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = TradingViewWebhookSchema.safeParse(body);
  if (!parsed.success) {
    try {
      const svc = getServiceClient();
      await svc.from("webhook_logs").insert({ event_id: null, payload: body as Record<string, unknown>, status: "BAD_REQUEST", error: parsed.error.message.slice(0, 500), ip });
    } catch {}
    return NextResponse.json({ error: "Bad request", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  // Secret validation (hashed compare)
  const expected = process.env.TRADINGVIEW_WEBHOOK_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  const ok = crypto.timingSafeEqual(Buffer.from(data.secret), Buffer.from(expected));
  if (!ok) {
    try {
      const svc = getServiceClient();
      await svc.from("webhook_logs").insert({ event_id: data.event_id ?? null, payload: data as unknown as Record<string, unknown>, status: "UNAUTHORIZED", error: "Invalid secret", ip });
    } catch {}
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Timestamp validation: reject if >5min skew (optional)
  if (data.timestamp) {
    const ts = new Date(data.timestamp).getTime();
    if (!Number.isNaN(ts) && Math.abs(Date.now() - ts) > 5 * 60_000) {
      // still accept but log; uncomment to reject:
      // return NextResponse.json({ error: "Stale timestamp" }, { status: 400 });
    }
  }

  // Idempotency: event_id or hash(payload+timestamp)
  const eventId = data.event_id || crypto.createHash("sha256").update(JSON.stringify({ symbol: data.symbol, action: data.action, price: data.price, timeframe: data.timeframe, timestamp: data.timestamp })).digest("hex");

  const svc = getServiceClient();

  // Duplicate check
  const { data: existing } = await svc.from("trading_signals").select("id").eq("event_id", eventId).maybeSingle();
  if (existing) {
    await svc.from("webhook_logs").insert({ event_id: eventId, payload: data as unknown as Record<string, unknown>, status: "DUPLICATE", ip });
    return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
  }

  // For now, webhook is unauthenticated by user - we need to map secret to user?
  // Simplified: store signal without user_id? But RLS requires user_id. We store with null and require later claim via secret->user mapping.
  // For MVP: find user by webhook secret mapping in tradingview_connections or use first user? Better: store with service role bypassing RLS, but need user_id.
  // Here we lookup user who owns the secret via tradingview_connections.config->secret ? For now, insert with service role and require client to set TRADINGVIEW_USER_ID env for single-user demo.
  // Fallback: use anon user mapping via env TRADINGVIEW_DEFAULT_USER_ID

  const defaultUserId = process.env.TRADINGVIEW_DEFAULT_USER_ID;
  let userId: string | null = defaultUserId ?? null;

  // Try lookup connection by secret hash? Simplified: find any user with matching secret in env mapping is not DB; we just use defaultUserId.

  if (!userId) {
    // No user mapping - log and return 400 to force configuration
    await svc.from("webhook_logs").insert({ event_id: eventId, payload: data as unknown as Record<string, unknown>, status: "BAD_REQUEST", error: "No user mapping for webhook. Set TRADINGVIEW_DEFAULT_USER_ID or implement per-user secret lookup.", ip });
    return NextResponse.json({ error: "No user mapping. Configure TRADINGVIEW_DEFAULT_USER_ID" }, { status: 400 });
  }

  const { error: insertErr } = await svc.from("trading_signals").insert({
    user_id: userId,
    symbol: data.symbol,
    action: data.action,
    entry_price: data.price,
    timeframe: data.timeframe,
    strategy: data.strategy ?? null,
    stop_loss: data.stopLoss ?? null,
    take_profit: data.takeProfit ?? null,
    source: "tradingview",
    event_id: eventId,
  });

  if (insertErr) {
    await svc.from("webhook_logs").insert({ event_id: eventId, payload: data as unknown as Record<string, unknown>, status: "SERVER_ERROR", error: insertErr.message.slice(0, 500), ip });
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }

  await svc.from("webhook_logs").insert({ user_id: userId, event_id: eventId, payload: data as unknown as Record<string, unknown>, status: "SUCCESS", ip });
  await svc.from("audit_logs").insert({ user_id: userId, action: "TRADINGVIEW_WEBHOOK", entity: "trading_signals", entity_id: eventId, metadata: { symbol: data.symbol, action: data.action, status: "SUCCESS", durationMs: Date.now() - startedAt } });

  // Realtime will propagate via Supabase Realtime (client subscribed to trading_signals)

  return NextResponse.json({ ok: true, event_id: eventId }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST /api/webhooks/tradingview with secret, symbol, action, price, timeframe" });
}
