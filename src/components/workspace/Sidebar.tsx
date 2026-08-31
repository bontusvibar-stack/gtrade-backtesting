"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspaceStore } from "@/store/workspace";
import { 
  LayoutDashboard, 
  Beaker, 
  Brain, 
  BarChart3, 
  Search, 
  Settings,
  ChevronRight,
  Zap,
  TrendingUp,
  BarChart2,
  Terminal,
  LineChart,
  Activity,
  ChevronLeft,
} from "lucide-react";

interface NavSection {
  title: string;
  items: { href: string; label: string; icon: React.ReactNode }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "COMMAND CENTER",
    items: [
      { href: "/dashboard", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
      { href: "/backtest", label: "Backtest", icon: <Beaker className="w-4 h-4" /> },
      { href: "/manual", label: "Manual", icon: <Activity className="w-4 h-4" /> },
    ],
  },
  {
    title: "STRATEGY & EDGE",
    items: [
      { href: "/strategies", label: "My Strategies", icon: <Brain className="w-4 h-4" /> },
      { href: "/strategies/builder", label: "Strategy Builder", icon: <Terminal className="w-4 h-4" /> },
      { href: "/strategies/public", label: "Public Strategies", icon: <Search className="w-4 h-4" /> },
    ],
  },
  {
    title: "PRACTICE & TEST",
    items: [
      { href: "/backtest/sessions", label: "Backtest Sessions", icon: <BarChart3 className="w-4 h-4" /> },
      { href: "/challenges/historical", label: "Historical Challenges", icon: <Zap className="w-4 h-4" /> },
      { href: "/challenges/daily", label: "Daily Challenge", icon: <TrendingUp className="w-4 h-4" /> },
    ],
  },
  {
    title: "GROWTH & COMMUNITY",
    items: [
      { href: "/battles", label: "Battles", icon: <BarChart2 className="w-4 h-4" /> },
      { href: "/trade-live", label: "Trade Live", icon: <LineChart className="w-4 h-4" /> },
    ],
  },
];

const SETTINGS_ITEM = { href: "/settings", label: "Settings", icon: <Settings className="w-4 h-4" /> };

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, activeWorkspace, setActiveWorkspace, sidebarCollapsed: isCollapsed } = useWorkspaceStore();
  const { aiAgent } = useWorkspaceStore();

  const isActive = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  const allItems = NAV_SECTIONS.flatMap(s => s.items);
  const activeItem = allItems.find(item => isActive(item.href))?.href || "/dashboard";

  return (
    <aside
      className="fixed left-0 top-0 z-70 h-full border-r border-emerald-900/20 bg-[#121212] transition-all duration-300 ease-out"
      style={{ width: sidebarCollapsed ? '64px' : '220px' }}
    >
      {/* Top Brand */}
      <div className="flex h-16 items-center justify-between border-b border-emerald-900/30 px-4">
        <AnimatePresence mode="wait">
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-xs font-bold tracking-widest text-emerald-300"
            >
              GTRADE
            </motion.span>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => useWorkspaceStore.getState().toggleSidebar()}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-colors"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronRight
              className="w-4 h-4 text-white/40 transition-transform duration-300"
              style={{ transform: sidebarCollapsed ? 'rotate(-90deg)' : 'rotate(90deg)' }}
            />
          </motion.button>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {!sidebarCollapsed && (
          <>
            {NAV_SECTIONS.map((section, sectionIndex) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sectionIndex * 0.05, duration: 0.3 }}
              >
                <p className="px-3 mb-2 text-[10px] font-semibold tracking-widest text-emerald-400/60 uppercase">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setActiveWorkspace(activeWorkspace)}
                        className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                          active
                            ? "bg-emerald-500/10 text-emerald-300 border-l-2 border-emerald-400"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className="flex h-5 w-5 items-center justify-center text-white/60 group-hover:text-white transition-colors">
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                        {active && (
                          <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 4 }}
                            exit={{ opacity: 0, width: 0 }}
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-4 bg-emerald-400 rounded-r-full"
                          />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </>
        )}

        <div className="border-t border-emerald-900/30 my-2" />
        
        {!sidebarCollapsed && (
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4 text-white/60" />
            <span>Settings</span>
          </Link>
        )}
      </nav>

      {/* AI Agent Footer */}
      <div className="border-t border-emerald-900/30 p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className={`relative flex h-2 w-2 rounded-full ${
            aiAgent.status === 'analyzing' || aiAgent.status === 'executing'
              ? 'bg-emerald-400 animate-pulse'
              : aiAgent.status === 'error'
              ? 'bg-red-400'
              : 'bg-emerald-400'
          }`} />
          <span className="text-[10px] font-medium tracking-widest text-emerald-300 uppercase">
            AI AGENT
          </span>
        </div>
        <p className="text-[11px] text-white/40 truncate">
          {aiAgent.currentTask 
            ? aiAgent.currentTask 
            : aiAgent.status === 'analyzing' 
              ? 'Analyzing market data...'
              : aiAgent.status === 'executing'
              ? 'Executing strategy...'
              : 'Ready'}
        </p>
        {aiAgent.status === 'analyzing' || aiAgent.status === 'executing' ? (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${aiAgent.progress}%` }}
            className="mt-2 h-1 rounded-full bg-emerald-400/20 overflow-hidden"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </motion.div>
        ) : null}
      </div>
    </aside>
  );
}

