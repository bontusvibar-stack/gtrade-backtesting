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
    <header className="fixed top-0 left-0 right-0 z-80 h-14 border-b border-emerald-900/20 bg-[#050505]/95 backdrop-blur-sm transition-all duration-300" style={{ left: '220px' }}>
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

        {/* Center: AI Status */}
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20"
          >
            <div className={`relative flex h-1.5 w-1.5 rounded-full ${
              aiAgent.status === 'analyzing' || aiAgent.status === 'executing'
                ? 'bg-emerald-400 animate-pulse'
                : aiAgent.status === 'error'
                ? 'bg-red-400'
                : 'bg-emerald-400'
            }`} />
            <span className="text-[11px] font-medium text-emerald-300">
              {aiAgent.status === 'analyzing' ? 'ANALYZING' :
               aiAgent.status === 'executing' ? 'EXECUTING' :
               aiAgent.status === 'error' ? 'ERROR' : 'READY'}
            </span>
          </motion.div>
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

          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Bell className="w-5 h-5 text-white/50" />
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-black">3</span>
          </motion.button>

          {/* User Menu */}
          <motion.div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 border border-emerald-500/30"
            >
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </header>
  );
}

