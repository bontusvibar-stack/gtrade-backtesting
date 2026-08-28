"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function RegisterPage() {
  const supabase = createClient();
  const isConfigured = isSupabaseConfigured();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConfigured) {
      setError("Supabase not configured — set env vars in Vercel first.");
      return;
    }
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        if (error.message.includes("fetch")) setError("Failed to fetch — check Vercel env vars.");
        else setError(error.message);
        return;
      }
      setMessage(
        "Account created. Check your email to confirm, then sign in. " +
          "If email confirmation is disabled in your Supabase project, you can sign in immediately.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
        <h1 className="text-lg font-semibold">Create account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Start backtesting strategies.</p>
        {!isConfigured && <div className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">Supabase not configured — set Vercel env vars first.</div>}
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium" htmlFor="email">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="password">Password</label>
            <input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-chart-1">{message}</p>}
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {loading ? "Creating..." : "Create account"}
          </motion.button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">Already have an account? <Link href="/login" className="text-foreground underline hover:text-primary">Sign in</Link></p>
      </motion.div>
    </div>
  );
}
