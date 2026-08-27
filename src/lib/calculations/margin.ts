export interface MarginInfo {
  usedMargin: number;
  freeMargin: number;
  marginLevel: number | null; // equity / usedMargin * 100, null if no position
  equity: number;
  balance: number;
}

/**
 * Margin model:
 * notional = quantity * contractSize * price
 * usedMargin = notional / leverage
 * freeMargin = equity - usedMargin
 * marginLevel = equity / usedMargin * 100
 */
export function calculateMargin(
  balance: number,
  unrealizedPnl: number,
  quantity: number,
  price: number,
  contractSize: number,
  leverage: number,
): MarginInfo {
  const equity = balance + unrealizedPnl;
  if (quantity === 0 || leverage <= 0) {
    return { usedMargin: 0, freeMargin: equity, marginLevel: null, equity, balance };
  }
  const notional = Math.abs(quantity) * (contractSize || 1) * Math.abs(price);
  const usedMargin = leverage > 0 ? notional / leverage : notional;
  const freeMargin = equity - usedMargin;
  const marginLevel = usedMargin > 0 ? (equity / usedMargin) * 100 : null;
  return { usedMargin, freeMargin, marginLevel, equity, balance };
}

export function hasInsufficientMargin(
  freeMargin: number,
  requiredMargin: number,
): boolean {
  return freeMargin < requiredMargin;
}

export function requiredMarginForOrder(
  quantity: number,
  price: number,
  contractSize: number,
  leverage: number,
): number {
  if (leverage <= 0) return 0;
  return (Math.abs(quantity) * (contractSize || 1) * Math.abs(price)) / leverage;
}
