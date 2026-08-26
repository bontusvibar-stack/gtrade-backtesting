# ADR-003 — Backtest Execution Model

- **Status:** Accepted
- **Date:** 2026-08-26

## Decision
The backtesting engine will be **deterministic**, enforce a **no look-ahead** rule, and use a **documented, explicit TP/SL collision resolution** that never silently selects the favorable outcome.

## Context
Reproducibility and statistical validity are the entire value of a backtester. Silent biases (seeing the future, favorable fill selection) produce misleading results and false confidence.

## Alternatives Considered
- **Non-deterministic / randomized slippage** — Realistic but unreproducible; rejected for the core engine (may be offered later as an explicit, opt-in Monte Carlo mode).
- **Pick-the-best fill on collision** — Common but fraudulent; rejected.

## Reason
A deterministic engine with explicit, documented execution rules lets users trust results and reproduce runs exactly. The same-candle TP/SL collision rule removes ambiguity and prevents accidental favorable-outcome bias.

## Consequences
- Engine must be pure, with no wall-clock or random reads during replay.
- Execution Model.md is the contract; deviations are correctness bugs.
- Any future stochastic mode must be clearly separated and opt-in.
