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
  const { sidebarCollapsed, agentPanelOpen, setAgentPanelOpen } = useWorkspaceStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 10);
    return () => clearTimeout(t);
  }, []);

  if (!ready) return <Connecting onReady={() => setReady(true)} />;

  return (
    <div className="min-h-screen bg-[#050505] text-white relative">
      <div className="pointer-events-none fixed inset-0 opacity-[0.015]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />
      <div className="pointer-events-none fixed inset-0 bg-radial from-amber-500/[0.04] via-transparent to-transparent" style={{ background: "radial-gradient(600px 600px at 50% 0%, rgba(245,158,11,0.04), transparent 70%)" }} />
      <Sidebar />
      <TopBar />
      <CommandBar />
      <div className="transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? 64 : 230, marginTop: 56, marginRight: agentPanelOpen ? 360 : 0 }}>
        <main className="min-h-[calc(100vh-56px)] pb-16 md:pb-0">{children}</main>
      </div>
      <div className="hidden xl:block">
        <AIAgentPanel />
      </div>
      {!agentPanelOpen && (
        <button
          onClick={() => setAgentPanelOpen(true)}
          className="hidden xl:flex fixed right-4 bottom-4 z-40 items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500 px-4 py-2 text-xs font-semibold text-black shadow-lg hover:bg-amber-400 transition"
          aria-label="Open agent panel"
        >
          <span className="h-2 w-2 rounded-full bg-black animate-pulse" /> Open Agent
        </button>
      )}
      <MobileNav />
    </div>
  );
}
