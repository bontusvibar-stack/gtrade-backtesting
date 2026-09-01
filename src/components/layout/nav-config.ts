import Link from "next/link";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tradingview", label: "TradingView" },
  { href: "/backtest", label: "Backtest" },
  { href: "/manual", label: "Manual" },
  { href: "/strategies", label: "Strategies" },
  { href: "/market-data", label: "Market Data" },
  { href: "/results", label: "Results" },
  { href: "/compare", label: "Compare" },
  { href: "/optimize", label: "Optimize" },
  { href: "/analytics", label: "Analytics" },
  { href: "/monte-carlo", label: "Monte Carlo" },
  { href: "/settings", label: "Settings" },
];
