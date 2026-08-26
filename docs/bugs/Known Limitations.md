# Known Limitations

> Tracking current gaps and planned fixes. See Product Roadmap for phase status.

## Engine Not Yet Implemented
- The deterministic backtesting engine (Phase 3) is **not yet implemented**. Strategy, Order Simulator, Position Manager, Portfolio, and Metrics Engine exist only as specifications (see Backtesting Engine.md, Execution Model.md, Metric Formulas.md).

## No Real Market Data Yet
- No live or historical market data is connected. The `market_data_*` tables and ingestion pipeline are PLANNED (Phase 7).

## Demo Data Pending
- No demo/sample datasets are available to exercise the UI end-to-end. Needed to validate the rendering and results pipeline before real data arrives.

## BUG-001 — Equity Curve Mismatch
- **Title:** Equity curve mismatch between portfolio tracking and reported metrics.
- **Status:** Open (to be addressed during engine work, Phase 3).
- **Description:** When the engine is implemented, the equity points used for drawdown/Sharpe must reconcile exactly with realized+unrealized PnL from trade records. Any drift between the `equity_points` series and the trade-based equity calculation is a defect.
- **Plan:** Add a reconciliation assertion in the Metrics Engine; fail the backtest run if equity-point vs trade-derived equity diverge beyond a tolerance.
