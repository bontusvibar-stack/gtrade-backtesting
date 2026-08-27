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

export function swapCost(
  side: Side,
  quantity: number,
  daysHeld: number,
  swapLong: number = 0,
  swapShort: number = 0,
  fundingRate: number = 0,
  price: number = 0,
): number {
  // swapLong/Short per lot per day (can be negative cost)
  // fundingRate for crypto: per 8h funding applied per day = 3 * rate * notional
  const swapPerDay = side === "buy" ? swapLong : swapShort;
  const swap = swapPerDay * quantity * daysHeld;
  const funding = fundingRate ? fundingRate * 3 * quantity * price * daysHeld : 0;
  return swap + funding;
}

export function pipValueToPrice(pips: number, pipSize: number = 0.0001): number {
  return pips * pipSize;
}

export function atrBasedLevels(
  entry: number,
  atr: number,
  side: Side,
  slAtrMult: number = 2,
  tpAtrMult: number = 4,
): { stopLoss: number; takeProfit: number } {
  if (side === "buy") {
    return { stopLoss: entry - atr * slAtrMult, takeProfit: entry + atr * tpAtrMult };
  }
  return { stopLoss: entry + atr * slAtrMult, takeProfit: entry - atr * tpAtrMult };
}
