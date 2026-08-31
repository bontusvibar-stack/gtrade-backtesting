"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useWorkspaceStore } from "@/store/workspace";
import { Command, Bell, Sparkles, ChevronLeft, LayoutDashboard, Brain, BarChart3, Beaker, Search, Settings } from "lucide-react";

export function TopBar() {
  const pathname = usePathname();
  const { activeWorkspace, sidebarCollapsed, toggleSidebar, commandBarOpen, setCommandBarOpen, aiAgent } = useWorkspaceStore();

  const getWorkspaceLabel = (id: string) => {
    const labels: Record<string, string> = {
      'command-center': 'COMMAND CENTER',
      'backtest': 'BACKTEST',
      'strategies': 'STRATEGIES',
      'analytics': 'ANALYTICS',
      'research': 'RESEARCH',
      'settings': 'SETTINGS',
    };
    return labels[id] || 'GTRADE';
  };

  const getWorkspaceIcon = (id: string) => {
    const icons: Record<string, React.ReactNode> = {
      'command-center': <LayoutDashboard className="w-4 h-4" />,
      'backtest': <Beaker className="w-4 h-4" />,
      'strategies': <Brain className="w-4 h-4" />,
      'analytics': <BarChart3 className="w-4 h-4" />,
      'research': <Search className="w-4 h-4" />,
      'settings': <Settings className="w-4 h-4" />,
    };
    return icons[id] || <LayoutDashboard className="w-4 h-4" />;
  };

  const workspaceIcon = getWorkspaceIcon(activeWorkspace);
  const workspaceLabel = getWorkspaceLabel(activeWorkspace);

  return (
    <header className="fixed top-0 right-0 z-80 h-14 border-b border-white/[0.06] bg-[#050505]/95 backdrop-blur-sm transition-all duration-300" style={{ left: '230px' }}>
      <div className="flex h-full items-center justify-between px-4">
        {/* Left: Workspace breadcrumb */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => useWorkspaceStore.getState().toggleSidebar()}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-colors"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft className="w-4 h-4 text-white/40" />
          </motion.button>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-sm"
          >
            <span className="text-white/40">/</span>
            <span className="font-semibold tracking-widest text-white">{workspaceLabel}</span>
          </motion.div>
        </div>

        {/* Center: Ambient system status */}
        <div className="flex items-center gap-2 text-xs">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          <span className="tracking-wide text-white/50">SYSTEM OPERATIONAL</span>
          <span className="hidden md:inline text-white/20">•</span>
          <span className="hidden md:inline tracking-wide text-emerald-300/70">{aiAgent.status === 'analyzing' ? 'ANALYZING' : aiAgent.status === 'executing' ? 'EXECUTING' : 'READY'}</span>
        </div>

        {/* Right: Command Bar trigger + Notifications + User */}
        <div className="flex items-center gap-2">
          {/* Command Bar Trigger */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => useWorkspaceStore.getState().setCommandBarOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors"
            aria-label="Open command bar (⌘K)"
          >
            <Command className="w-4 h-4 text-white/40" />
            <kbd className="hidden px-2 py-0.5 text-[10px] font-mono bg-white/5 rounded text-white/40 md:inline-flex">⌘K</kbd>
            <span className="hidden text-white/50 md:inline">Ask GTrade Agent</span>
          </motion.button>

          <motion.a href="/backtest" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="hidden md:inline-flex items-center rounded-full bg-amber-500 px-4 py-1.5 text-xs font-semibold text-black shadow-[0_0_16px_rgba(245,158,11,0.35)] hover:bg-amber-400">
            Start New Session
          </motion.a>

          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/10 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black">3</span>
          </motion.button>

          {/* User avatar */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => useWorkspaceStore.getState().toggleAgentPanel()}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-xs font-bold text-black"
            aria-label="Toggle agent panel"
          >
            A
          </motion.button>
        </div>
      </div>
    </header>
  );
}

