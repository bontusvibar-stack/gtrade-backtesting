"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "../workspace/Sidebar";
import { TopBar } from "../workspace/TopBar";
import { AIAgentPanel } from "../workspace/AIAgentPanel";
import { CommandBar } from "../workspace/CommandBar";
import { Connecting } from "../loading/Connecting";
import { useWorkspaceStore } from "@/store/workspace";
import { MobileNav } from "./mobile-nav";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { sidebarCollapsed } = useWorkspaceStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 10);
    return () => clearTimeout(t);
  }, []);

  if (!ready) return <Connecting onReady={() => setReady(true)} />;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Sidebar />
      <TopBar />
      <CommandBar />
      <div className="transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? 64 : 220, marginTop: 56, marginRight: 0 }}>
        <main className="min-h-[calc(100vh-56px)] pb-16 md:pb-0">{children}</main>
      </div>
      {/* AIAgentPanel is overlay; desktop only */}
      <div className="hidden xl:block">
        <AIAgentPanel />
      </div>
      <MobileNav />
    </div>
  );
}
