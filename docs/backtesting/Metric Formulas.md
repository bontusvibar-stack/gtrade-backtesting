# Metric Formulas

> **STATUS: SPEC TO BE IMPLEMENTED IN PHASE 3.** These formulas define the metrics the Metrics Engine must produce. They are the contract; implementation lives in `src/lib/backtesting` / `src/lib/calculations` during Phase 3.

Notation:
- `E[i]` = equity at point i; `E[0]` = starting capital.
- `R[i]` = return of period i = `E[i]/E[i-1] - 1`.
- `T` = a closed trade; `pnl(T)` = profit/loss of trade; `r(T)` = R-multiple of trade.
- `W` = winning trades; `L` = losing trades.

## Net Profit
`Net Profit = sum(pnl(T) for all T) = E[final] - E[0]`

## Total Return
`Total Return % = (E[final] / E[0] - 1) * 100`

## Win Rate
`Win Rate % = (count(W) / (count(W) + count(L))) * 100`

## Profit Factor
`Profit Factor = sum(pnl(T)) for W / abs(sum(pnl(T)) for L)`
(If losers sum to 0, Profit Factor = infinity.)

## Expectancy
`Expectancy = (Win Rate * Avg Win) + ((1 - Win Rate) * Avg Loss)`
where Avg Win/Loss are mean pnl per trade.

## Average R
`Average R = mean(r(T))` over all closed trades, where `r(T) = pnl(T) / risk(T)` and `risk(T)` is initial risk (SL distance * size).

## Max Drawdown
`Max Drawdown = max over i of (peak_equity_up_to_i - E[i])`

## Max Drawdown %
`Max Drawdown % = max over i of ((peak_equity_up_to_i - E[i]) / peak_equity_up_to_i) * 100`

## Recovery Factor
`Recovery Factor = Net Profit / Max Drawdown` (absolute value)

## Sharpe Ratio
`Sharpe = (mean(R) / std(R)) * sqrt(periods_per_year)`
Using per-period simple returns; annualization factor depends on timeframe.

## Sortino Ratio
`Sortino = (mean(R) / downside_std(R)) * sqrt(periods_per_year)`
where `downside_std` uses only negative returns (R < 0 or R < target).

## Best Day / Worst Day
`Best Day = max daily return %; Worst Day = min daily return %`
Aggregated from equity points grouped by calendar day (UTC).

## Monthly Return
`Monthly Return % = (E[month_end] / E[month_start] - 1) * 100`
Reported per calendar month.
