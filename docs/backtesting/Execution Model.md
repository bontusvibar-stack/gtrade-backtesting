# Execution Model

The execution model defines how simulated orders are filled. It is part of the deterministic engine contract and must be implemented exactly as documented to avoid hidden biases.

## Chronological Candle Processing
- Candles are processed strictly in time-ascending order.
- A strategy decision made on candle `t` can only act on candle `t` or later — never on `t-1`.

## Market Order Timing
- A market order generated from `onCandle(t)` is filled at the **open of the next candle (`t+1`)**, not at the current candle close. This avoids the unrealistic assumption that you can trade at the close you just observed.
- Exception: if configured for same-candle fills, the fill uses the current candle's open (the first price seen) — documented and deterministic.

## Spread
- A configurable spread (in price units) is applied against the position: buys fill at `ask = price + spread/2`, sells at `bid = price - spread/2`.

## Commission
- Charged per fill as a percentage of notional or a fixed amount, configurable in `backtest_configs.settings`.

## Slippage
- Optional simulated slippage applied to fill price (e.g. `fill = price * (1 ± slippage)` for buys/sells). Must be symmetric by default and deterministic.

## Same-Candle TP/SL Collision Rule
When both a Take Profit and Stop Loss would be triggered within the same candle (the candle's range spans both levels), the engine applies the following **deterministic** rule:
- The side that is hit **first in price-time order** wins. For a long position: if the candle's low (SL) occurs before reaching the high (TP), the SL is filled; otherwise TP. The order is determined by comparing which extreme is reached first — by convention, assume the stop is triggered first (price moves against the position before reaching profit) unless the candle opens beyond TP.
- **Never silently pick the favorable outcome.** The engine must resolve the collision explicitly and log which level was hit.
- This resolution is fixed and identical across runs.

## Time Zone
- All internal timestamps are UTC. Display conversions happen only in the UI layer.
