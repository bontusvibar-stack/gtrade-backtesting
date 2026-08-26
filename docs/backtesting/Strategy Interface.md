# Strategy Interface

Strategies are plain TypeScript objects consumed by the engine. They contain **no React** and must **never manipulate React state** — they are pure logic operating on the engine-provided context.

## Interface

```ts
interface Strategy {
  id: string;
  name: string;
  description: string;
  version: number;

  // Declared parameters (editable by UI, passed in by engine)
  parameters: StrategyParameter[];

  // Called once before the candle loop
  initialize(context: StrategyContext): void;

  // Called once per candle, in chronological order
  onCandle(context: StrategyContext, candle: Candle): void;

  // Optional lifecycle hooks
  onOrder?(order: Order): void;
  onPosition?(position: Position): void;

  // Called once after the last candle
  finalize(context: StrategyContext): void;
}
```

## Members

- `id` — unique strategy identifier.
- `name` — human-readable name.
- `description` — short summary of the logic.
- `version` — integer version, aligned with `strategy_versions`.
- `parameters` — declarative list of tunable inputs (name, type, default, min/max). The UI renders controls from this; the engine injects resolved values into `context.params`.

## Lifecycle

- `initialize(context)` — set up state, precompute indicators. Called once.
- `onCandle(context, candle)` — core decision logic. May inspect `context.params`, indicator series, and portfolio state. May emit signals via `context.buy/sell/close`. Only data at `candle.time` and earlier is visible (no look-ahead).
- `onOrder(order)` — notification when an order is simulated/filled.
- `onPosition(position)` — notification on position open/update/close.
- `finalize(context)` — clean up, force-close open positions if desired, emit final notes.

## Rules
- Strategies must not import React or mutate any UI state.
- Strategies must not read future candles or external async data during the loop.
- All state must live in the `context` or in closures created by `initialize` — never global mutable singletons.

## `StrategyContext` (provided by engine)
- `params` — resolved parameter values.
- `portfolio` — current cash, equity, open positions.
- `indicators` — helper access to `src/lib/indicators`.
- `buy(size?, meta?)`, `sell(size?, meta?)`, `close(meta?)` — signal emitters.
- `candleIndex` — current position in the series.
