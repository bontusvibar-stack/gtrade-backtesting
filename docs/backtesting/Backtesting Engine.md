# Backtesting Engine

The backtesting engine is a deterministic, framework-free TypeScript module under `src/lib/backtesting`. It takes historical market data and a strategy, replays it chronologically, and produces a complete backtest result.

## Pipeline

```
Historical Data
  -> Candle Processor
    -> Strategy Engine
      -> Signal
        -> Order Simulator
          -> Position Manager
            -> Portfolio
              -> Trade Records
                -> Metrics Engine
                  -> Backtest Result
```

### 1. Historical Data
- Input: an ordered array of candles (`{ time, open, high, low, close, volume }`).
- Must be strictly ascending by `time` (UTC). Out-of-order data is rejected.

### 2. Candle Processor
- Validates candles and feeds them one at a time to the engine in chronological order.
- Normalizes timestamps and ensures no gaps break the loop contract.

### 3. Strategy Engine
- Calls `strategy.initialize(context)` once.
- For each candle, calls `strategy.onCandle(context, candle)`.
- The strategy may emit a `Signal` (buy/sell/close) based only on data available up to and including the current candle (no look-ahead).

### 4. Signal
- A decision object: `BUY`, `SELL`, `CLOSE`, or `HOLD`, with an optional size/parameter payload.

### 5. Order Simulator
- Translates a signal into a simulated order, applying execution assumptions (spread, commission, slippage, market-order timing). See `Execution Model.md`.

### 6. Position Manager
- Opens, updates, and closes positions. Evaluates TP/SL on each candle using the documented collision rule.

### 7. Portfolio
- Tracks equity, cash, open positions, and realized/unrealized PnL after every candle.

### 8. Trade Records
- Every filled order and closed trade is recorded with entry/exit prices, timestamps, and PnL.

### 9. Metrics Engine
- Computes performance statistics from the equity curve and trade records. See `Metric Formulas.md`.

### 10. Backtest Result
- The final object: metrics, trades, equity points, and metadata. Deterministic for a given input.

## Determinism
The engine has no internal randomness, no wall-clock reads during the loop, and no async data fetches inside the replay. The same `(data, strategy, config)` always yields the identical result.
