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
    title: "HOME",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
      { href: "/analytics", label: "Stats", icon: <BarChart3 className="w-4 h-4" /> },
      { href: "/journal", label: "Trade Journal", icon: <Activity className="w-4 h-4" /> },
    ],
  },
  {
    title: "STRATEGY & EDGE",
    items: [
      { href: "/strategies/ai", label: "AI Analyst", icon: <Brain className="w-4 h-4" /> },
      { href: "/strategies", label: "My Strategies", icon: <Terminal className="w-4 h-4" /> },
      { href: "/strategies/public", label: "Public Strategies", icon: <Search className="w-4 h-4" /> },
    ],
  },
  {
    title: "PRACTICE & TEST",
    items: [
      { href: "/backtest", label: "Backtesting Sessions", icon: <Beaker className="w-4 h-4" /> },
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
      className="fixed left-0 top-0 z-70 h-full border-r border-white/[0.06] bg-[#121212] transition-all duration-300 ease-out"
      style={{ width: sidebarCollapsed ? '64px' : '230px' }}
    >
      {/* Top Brand */}
      <div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-4">
        <AnimatePresence mode="wait">
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <p className="text-xs font-bold tracking-widest text-white">GTRADE</p>
              <p className="text-[10px] tracking-widest text-white/40">BACKTEST</p>
            </motion.div>
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
                <p className="px-3 mb-2 text-[10px] font-semibold tracking-widest text-white/30 uppercase">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    const isBonus = item.label === "Trade Live";
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setActiveWorkspace(activeWorkspace)}
                        className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                          active
                            ? "bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                            : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                        }`}
                      >
                        <span className={`flex h-5 w-5 items-center justify-center transition-colors ${active ? "text-amber-400" : "text-white/40"}`}>
                          {item.icon}
                        </span>
                        <span className="truncate flex-1">{item.label}</span>
                        {isBonus && <span className="text-[9px] font-bold tracking-widest text-amber-400 border border-amber-500/30 rounded px-1.5 py-0.5">BONUS</span>}
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </>
        )}

        <div className="border-t border-white/[0.06] my-2" />
        
        {!sidebarCollapsed && (
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/50 hover:bg-white/[0.04] hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4 text-white/40" />
            <span>Settings</span>
          </Link>
        )}
      </nav>

      {/* AI Agent Footer */}
      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className={`relative flex h-2 w-2 rounded-full ${
            aiAgent.status === 'analyzing' || aiAgent.status === 'executing'
              ? 'bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]'
              : aiAgent.status === 'error'
              ? 'bg-red-400'
              : 'bg-emerald-400'
          }`} />
          <span className="text-[10px] font-medium tracking-widest text-white/60 uppercase">
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
            className="mt-2 h-1 rounded-full bg-amber-500/20 overflow-hidden"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </motion.div>
        ) : null}
      </div>
    </aside>
  );
}

