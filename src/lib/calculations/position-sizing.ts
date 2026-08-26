export function fixedLotPositionSize(lot: number): number {
  return lot;
}

export function percentRiskPositionSize(
  equity: number,
  riskPercent: number,
  entry: number,
  stopLoss: number,
  contractSize = 1,
): number {
  const riskAmount = (equity * riskPercent) / 100;
  const riskPerUnit = Math.abs(entry - stopLoss) * contractSize;
  if (riskPerUnit === 0) return 0;
  return riskAmount / riskPerUnit;
}

export function fixedMoneyPositionSize(
  riskAmount: number,
  entry: number,
  stopLoss: number,
  contractSize = 1,
): number {
  const riskPerUnit = Math.abs(entry - stopLoss) * contractSize;
  if (riskPerUnit === 0) return 0;
  return riskAmount / riskPerUnit;
}
