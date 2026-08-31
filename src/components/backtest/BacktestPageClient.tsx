"use client";

import { useState } from "react";
import { BacktestWizard } from "./BacktestWizard";
import { BacktestWorkspace, type DatasetOption } from "./backtest-workspace";

export function BacktestPageClient({ datasets, onStart }: { datasets: DatasetOption[]; onStart?: () => void }) {
  const [wizard, setWizard] = useState(false);
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Backtest Workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">Configure and run a backtest against historical market data.</p>
        </div>
        <button onClick={() => setWizard(true)} className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-semibold text-black shadow-[0_0_16px_rgba(245,158,11,0.35)] hover:bg-amber-400">
          Start New Session
        </button>
      </div>
      <BacktestWizard open={wizard} onClose={() => setWizard(false)} onStart={() => { setWizard(false); onStart?.(); }} />
      <BacktestWorkspace datasets={datasets} />
    </>
  );
}
