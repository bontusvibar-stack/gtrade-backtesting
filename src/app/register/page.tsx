"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage(
      "Account created. Check your email to confirm, then sign in. " +
        "If email confirmation is disabled in your Supabase project, you can sign in immediately.",
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Create account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Start backtesting strategies.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-chart-1">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
