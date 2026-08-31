"use client";

import { CommandCenter } from "@/components/workspace/CommandCenter";

export function DashboardWrapper(props: React.ComponentProps<typeof CommandCenter>) {
  return <CommandCenter {...props} />;
}
