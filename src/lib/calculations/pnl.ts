import type { Side } from "@/types/backtesting";

export function grossPnl(
  side: Side,
  entry: number,
  exit: number,
  quantity: number,
  contractSize = 1,
): number {
  const dir = side === "buy" ? 1 : -1;
  return dir * (exit - entry) * quantity * contractSize;
}

export type CommissionModel = "percent" | "per_unit" | "flat";

export function commissionCost(
  model: CommissionModel,
  value: number,
  notional: number,
  quantity: number,
): number {
  switch (model) {
    case "percent":
      return (notional * value) / 100;
    case "per_unit":
      return Math.abs(quantity) * value;
    case "flat":
      return value;
    default:
      return 0;
  }
}

export function rMultiple(netPnl: number, initialRisk: number): number {
  if (initialRisk === 0) return 0;
  return netPnl / initialRisk;
}
