# Backtesting Engine

This document describes the implemented architecture of the backtest engine in
`src/lib/backtesting/engine.ts` (function `runBacktest`). The engine is
framework-free, deterministic, and has no external dependencies beyond the
calculation/indicator libraries. All behavior is covered by
`tests/unit/engine.test.ts` and `tests/unit/indicators.test.ts`.

---

## Pipeline

`runBacktest(config, candlesInput, strategy)` executes the following ordered
steps for every run:

1. **Sort candles chronologically** — input candles are copied and sorted by
   `timestamp` ascending. This guarantees a stable time order regardless of input.
2. **Initialize strategy** — `strategy.initialize?.(ctx)` is called once before
   the loop (optional hook).
3. **Per-candle loop** (`for i in candles`):
   a. **Fill pending order** — if a `next_open` order was queued on the previous
      candle, it is filled at the current candle's **open** price (step 3 below
      explains the `close` exception).
   b. **Check exits (TP/SL)** — if a position is open, the current candle's
      **high/low** are inspected against stop-loss and take-profit levels.
   c. **Strategy decision** — `strategy.onCandle(ctx, candle)` runs. It may open
      a new pending order or close the open position.
   d. **Immediate fill for `close` model** — if a pending order uses the `close`
      execution model, it is filled immediately at the candle **close**.
   e. **Record equity** — realized balance plus unrealized P&L (marked at candle
      close) is appended to the equity curve.
4. **Close open position at end of data** — any remaining position is closed at
   the last candle's close with reason `end_of_data`.
5. **Finalize strategy** — `strategy.finalize?.(ctx)` is called once (optional).
6. **Compute metrics** — `computeMetrics` runs on the trades and equity curve.
7. **Backfill drawdown** — per-point drawdown/drawdown% are computed on equity
   points (post-metrics, so the curve matches the recorded values).

A `StrategyContext` (`ctx`) is passed to the strategy and exposes: `candles`,
`currentIndex`, `config`, `symbolSpec`, `equity`, `hasPosition()`, `open(params)`,
and `close(reason)`.

---

## No Look-Ahead

The strategy receives `ctx.candles` and `ctx.currentIndex`. By convention the
strategy must only read `candles[0..currentIndex]`; it can never see future
candles. Exits are evaluated against the **high and low of the current candle
only** — a stop or limit is considered touched only if the candle's range
actually reached the level. There is no peeking at the next candle's data to
decide the current candle's action.

---

## Execution Model

Two fill timing modes are supported (`config.execution.executionModel`):

- **`close`** — orders fill at the candle's **close** price. Pending orders
  opened during `onCandle` are filled in the same candle, after the strategy
  call.
- **`next_open`** — orders fill at the **next** candle's **open** price. The
  order is queued (`state.pending`) and filled at the top of the following
  candle iteration.

**Spread & slippage (adverse to the trader):** entry and exit prices are
adjusted by `spread + slippage`. On entry the adjustment pushes the fill price
*against* the trader (buy higher, sell lower); on exit it again moves *against*
the trader (buy lower to close, sell higher to close). This is implemented in
`applyEntryAdjustment` / `applyExitAdjustment`. Slippage is additionally
accounted as a realized cost in P&L (`entrySlip + exitSlip`).

---

## TP/SL Collision Rule

When a single candle's range touches **both** the stop-loss and the
take-profit, the outcome is resolved by `config.execution.tpSlCollision`:

- **`stop_first`** (default) — stop wins. Worst case for the trader; never
  silently favorable.
- **`limit_first`** — limit (take-profit) wins.
- **`both_touched_favor_broker`** — stop wins (broker-favorable = trader-worst).

When only one side is touched, that side simply executes. The default
`stop_first` guarantees that ambiguous candles resolve to the unfavorable
outcome rather than being assumed favorable.

---

## Position Sizing

`determineQuantity` selects a size based on `config.risk.mode`:

- **`fixed_lot`** — quantity = `config.risk.fixedLot`.
- **`percent_risk`** — `quantity = (equity * riskPercent) / (|entry - stop| * contractSize)`,
  computed by `percentRiskPositionSize`. Requires a stop-loss.
- **`fixed_money`** — `quantity = fixedRisk / (|entry - stop| * contractSize)`,
  computed by `fixedMoneyPositionSize`. Requires a stop-loss.

If an explicit `quantity` is supplied by the strategy, it overrides all modes.
A non-positive computed size triggers a warning and the order is skipped.

---

## Equity & P&L Recording

Each closed trade records: entry/exit price (rounded to `pricePrecision`),
quantity (`quantityPrecision`), `grossPnl`, `commission`, `slippage`,
`netPnl = grossPnl - commission - slippage`, and `rMultiple`. Closed trades are
also accumulated into a per-day P&L map used for max-daily-loss gating.

Equity is recorded per candle as `balance + unrealizedPnl(marked at close)`.
The engine also enforces `maxTrades` and `maxDailyLoss` guards: once the daily
loss limit or trade cap is hit, `allowNewEntries` becomes false and the strategy
cannot open new positions (existing positions still exit normally).

---

## RLS / Determinism Note

The engine is intentionally **framework-free** (no React, no Next.js, no
database access) and **deterministic**: identical `(config, candles, strategy)`
inputs always produce identical `RunResult`. It performs no network or
row-level-security (RLS) operations; those concerns belong to the data/access
layer, not the engine. This separation keeps the engine pure, testable, and
safe to run server-side or in a worker.

---

## Demo Strategies

Three reference strategies live in `src/lib/backtesting/strategies/`:

- **`sma_crossover`** (`sma-crossover.ts`) — goes long/short when a fast SMA
  crosses a slow SMA.
- **`rsi_threshold`** (`rsi-threshold.ts`) — enters when RSI crosses below an
  oversold threshold (long) or above an overbought threshold (short), typically
  exiting on a reversion.
- **`breakout`** (`breakout.ts`) — enters when price breaks above/below a recent
  high/low range.

These are illustrative; custom strategies implement the `Strategy` interface
(`initialize?`, `onCandle`, `finalize?`).

---

## Indicators

All technical indicators live in `src/lib/indicators` and are UI/engine
independent (pure functions, fully unit-tested). Available indicators:
`sma`, `ema`, `wma`, `rsi`, `macd`, `bollinger`, `atr`, `stochastic`, `adx`,
`vwap`. They are imported by strategies on demand and never depend on React or
the backtest engine.
