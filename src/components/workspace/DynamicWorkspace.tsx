"use client";

import { useWorkspaceStore } from "@/store/workspace";
import { CommandCenter } from "./CommandCenter";

interface DynamicWorkspaceProps {
  commandCenterData: React.ComponentProps<typeof CommandCenter>;
}

export function DynamicWorkspace({ commandCenterData }: DynamicWorkspaceProps) {
  const { activeWorkspace } = useWorkspaceStore();

  // For now, render CommandCenter for every workspace; individual routes remain for deep linking.
  // This keeps Supabase logic intact while giving the unified feel.
  if (activeWorkspace === "command-center") {
    return <CommandCenter {...commandCenterData} />;
  }

  // Fallback: instruct to use route navigation; will be replaced by embedded workspaces in phase 2
  return <CommandCenter {...commandCenterData} />;
}
