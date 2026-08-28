import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: url ? `${new URL(url).hostname}` : "MISSING",
    NEXT_PUBLIC_SUPABASE_URL_present: Boolean(url),
    NEXT_PUBLIC_SUPABASE_ANON_KEY_present: Boolean(key),
    NEXT_PUBLIC_SUPABASE_ANON_KEY_length: key?.length ?? 0,
    NEXT_PUBLIC_SUPABASE_ANON_KEY_prefix: key ? `${key.slice(0, 15)}...` : "MISSING",
    isConfigured: Boolean(url && key && !url.includes("placeholder")),
    hint: "Set both vars in Vercel → Settings → Environment Variables (Production), then Redeploy with cache OFF",
  });
}
