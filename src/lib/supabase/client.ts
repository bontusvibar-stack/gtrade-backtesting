import { createBrowserClient } from "@supabase/ssr";

const PLACEHOLDER_URL = "https://placeholder.supabase.co";

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("placeholder"));
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || PLACEHOLDER_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
  // Only log once in dev
  if (url === PLACEHOLDER_URL && typeof window !== "undefined") {
    console.warn("Supabase not configured — set NEXT_PUBLIC_SUPABASE_URL and ANON_KEY in Vercel env");
  }
  return createBrowserClient(url, key);
}
