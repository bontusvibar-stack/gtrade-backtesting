# Metric Formulas

This document specifies every metric computed by the backtest engine in
`src/lib/calculations/metrics.ts` (function `computeMetrics`). All formulas are
unit-tested in `tests/unit/calculations.test.ts`.

The engine accepts a `MetricsInput`:

- `trades` — array of closed trades, each with `netPnl`, `grossPnl`,
  `commission`, `slippage`, `rMultiple`, `side`, `entryTime`, `exitTime`,
  `exitReason`.
- `startingBalance` — initial account equity.
- `equityCurve` — equity value recorded after each candle (defaults to
  `[startingBalance]` if empty).
- `annualizationFactor` — defaults to `252`.

Helper definitions used throughout:

- `wins` = trades with `netPnl > 0`
- `losses` = trades with `netPnl <= 0`
- `curve` = `equityCurve` (or `[startingBalance]` if empty)
- `endingBalance` = last value of `curve`

---

## Balance Metrics

**Starting Balance**
- Formula: `startingBalance` (input)
- Notes: The initial equity deposited before any trading.

**Ending Balance**
- Formula: `equityCurve[equityCurve.length - 1]`
- Notes: Final equity after the last candle.

**Gross Profit**
- Formula: `sum(netPnl for wins)`
- Notes: Sum of positive net P&L only.

**Gross Loss**
- Formula: `abs(sum(netPnl for losses))`
- Notes: Absolute value of summed losing (and breakeven) trade P&L.

**Net Profit**
- Formula: `sum(netPnl for all trades)`
- Notes: Equals `endingBalance - startingBalance` over the curve. Includes
  commissions and slippage already deducted in trade P&L.

**Total Return %**
- Formula: `(netProfit / startingBalance) * 100`
- Notes: Returns 0 if `startingBalance <= 0`.

---

## Trade Statistics

**Trade Count**
- Formula: `trades.length`

**Winning Trades**
- Formula: `count(netPnl > 0)`

**Losing Trades**
- Formula: `count(netPnl <= 0)` (includes breakeven trades)

**Win Rate %**
- Formula: `(winningTrades / tradeCount) * 100`
- Notes: 0 if `tradeCount == 0`.

**Loss Rate %**
- Formula: `(losingTrades / tradeCount) * 100`
- Notes: 0 if `tradeCount == 0`. Equals `100 - winRate` only when no breakeven
  trades exist.

**Average Win**
- Formula: `grossProfit / winningTrades`
- Notes: 0 if no winning trades.

**Average Loss**
- Formula: `grossLoss / losingTrades`
- Notes: 0 if no losing trades. Positive number (gross loss is absolute).

**Largest Win**
- Formula: `max(netPnl for wins)`
- Notes: 0 if no winning trades.

**Largest Loss**
- Formula: `min(netPnl for losses)`
- Notes: Most negative trade P&L. 0 if no losing trades.

**Profit Factor**
- Formula: `grossProfit / grossLoss`
- Notes: If `grossLoss == 0`: returns `Infinity` when `grossProfit > 0`, else `0`.

**Expectancy**
- Formula: `netProfit / tradeCount`
- Notes: Average net P&L per trade. 0 if `tradeCount == 0`.

**Average R**
- Formula: `sum(rMultiple for all trades) / tradeCount`
- Notes: Mean of per-trade R-multiples. 0 if `tradeCount == 0`.

---

## R-Multiple Definition

**rMultiple** (per trade, computed in `src/lib/calculations/pnl.ts`):
- Formula: `rMultiple = netPnl / initialRisk`
- where `initialRisk = |entry - stopLoss| * quantity * contractSize`

Notes: `initialRisk` is the risk assumed at trade open (distance to stop times
size). An R of 2.0 means the trade earned twice its initial risk.

---

## Drawdown & Risk-Adjusted Metrics

**Max Drawdown**
- Formula: `max(peak - equity)` over the equity curve
- Notes: Largest absolute decline from a running peak. Computed by
  `computeDrawdown` in `src/lib/calculations/drawdown.ts`.

**Max Drawdown %**
- Formula: `maxDrawdown / peak_at_that_point * 100`

**Recovery Factor**
- Formula: `netProfit / maxDrawdown`
- Notes: If `maxDrawdown == 0`: returns `Infinity` when `netProfit > 0`, else `0`.

**Sharpe**
- Formula: `mean(periodReturns) / std(periodReturns) * sqrt(annualizationFactor)`
- where `periodReturns[i] = (curve[i] - curve[i-1]) / curve[i-1]`
- Notes: `std` is population standard deviation of period returns. If `std == 0`,
  Sharpe is `0`. Annualization factor `252` is a simplification.

**Sortino**
- Formula: `mean(periodReturns) / downsideStd * sqrt(annualizationFactor)`
- where `downsideStd = sqrt(sum(r<0 ? r^2 : 0 for r in periodReturns) / count(periodReturns))`
- Notes: Uses downside deviation as the denominator (only negative returns
  penalized). If `downsideStd == 0`, Sortino is `0`. Annualization factor `252`
  is a simplification.

---

## Period-Based Metrics

**Best Day**
- Formula: `max(sum(netPnl) grouped by exit calendar day)`
- Notes: Sums net P&L of all trades closed on each UTC day; reports the largest
  daily total. 0 if no trades have an `exitTime`.

**Worst Day**
- Formula: `min(sum(netPnl) grouped by exit calendar day)`
- Notes: Smallest (most negative) daily total. 0 if no closed trades.

**Monthly Return**
- Formula: `sum(sum(netPnl) grouped by exit calendar month)`
- Notes: Aggregates daily closed-trade P&L into each `YYYY-MM` bucket and sums
  across all months. 0 if no closed trades. Note: this is the total of monthly
  sums (net of all months), not a compounded figure.
