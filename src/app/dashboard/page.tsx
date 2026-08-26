import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const email = user.email ?? "unknown";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Signed in as {email}.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Account summary, performance metrics and recent activity will appear here in later phases.
      </p>
    </div>
  );
}
