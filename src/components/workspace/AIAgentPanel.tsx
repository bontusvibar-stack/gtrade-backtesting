"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useWorkspaceStore } from "@/store/workspace";
import { useState } from "react";
import { CheckCircle2, Loader2, AlertCircle, Zap, Brain, Trash2, X } from "lucide-react";

const quickActions = [
  { label: "Analyze Strategy", prompt: "Analyze my current strategy and identify weaknesses" },
  { label: "Run Backtest", prompt: "Run a backtest with my current configuration" },
  { label: "Compare Sessions", prompt: "Compare my last 3 backtest sessions" },
  { label: "Optimize Parameters", prompt: "Optimize strategy parameters for better risk-adjusted returns" },
  { label: "Run Monte Carlo", prompt: "Run Monte Carlo simulation on my last backtest" },
  { label: "Explain Drawdown", prompt: "Explain the largest drawdown period in my last backtest" },
];

export function AIAgentPanel() {
  const { aiAgent, resetAI, clearAIActivities, agentPanelOpen, setAgentPanelOpen } = useWorkspaceStore();
  const [inputValue, setInputValue] = useState("");

  if (!agentPanelOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const prompt = inputValue;
    setInputValue("");

    useWorkspaceStore.getState().addAIActivity({
      action: `User: ${prompt}`,
      status: "completed",
    });

    useWorkspaceStore.getState().setAIStatus("analyzing");
    useWorkspaceStore.getState().setAICurrentTask("Analyzing your request...");
    useWorkspaceStore.getState().setAIProgress(10);

    const steps = [
      { task: "Loading market data...", progress: 25 },
      { task: "Validating candle data...", progress: 40 },
      { task: "Running strategy engine...", progress: 60 },
      { task: "Calculating risk metrics...", progress: 80 },
      { task: "Running Monte Carlo simulation...", progress: 95 },
    ];

    for (const step of steps) {
      useWorkspaceStore.getState().setAICurrentTask(step.task);
      useWorkspaceStore.getState().setAIProgress(step.progress);
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
      useWorkspaceStore.getState().addAIActivity({
        action: step.task,
        status: "completed",
        progress: step.progress,
      });
    }

    useWorkspaceStore.getState().setAIStatus("ready");
    useWorkspaceStore.getState().setAIProgress(100);
    useWorkspaceStore.getState().setAIResult(
      `Analysis complete. Based on your ${useWorkspaceStore.getState().activeWorkspace} configuration, here are the key findings: Your strategy shows positive expectancy but deteriorates during high-volatility sessions. Consider reducing position size during news events. Monte Carlo simulation shows 68% probability of positive returns over 1000 trades.`
    );
  };

  const handleQuickAction = (prompt: string) => {
    setInputValue(prompt);
    handleSubmit(new Event("submit") as unknown as React.FormEvent);
  };

  return (
    <motion.aside
      initial={{ x: 360, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 360, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="fixed right-0 top-0 z-60 h-full border-l border-emerald-900/20 bg-[#0a0a0a] flex flex-col overflow-hidden shadow-2xl"
      style={{ width: "360px" }}
    >
      <div className="flex h-14 items-center justify-between border-b border-emerald-900/30 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
            <Brain className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-sm font-semibold tracking-widest text-emerald-300">GTRADE AGENT</span>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearAIActivities}
            className="p-1.5 rounded-lg text-white/40 hover:bg-white/5 hover:text-white transition-colors"
            aria-label="Clear history"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetAI}
            className="p-1.5 rounded-lg text-white/40 hover:bg-white/5 hover:text-white transition-colors"
            aria-label="Reset agent"
          >
            <Zap className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAgentPanelOpen(false)}
            className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Close agent panel"
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-emerald-900/30 bg-emerald-950/30 p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`relative flex h-3 w-3 rounded-full ${
                aiAgent.status === "analyzing" || aiAgent.status === "executing"
                  ? "bg-emerald-400 animate-pulse"
                  : aiAgent.status === "error"
                  ? "bg-red-400"
                  : "bg-emerald-400"
              }`}
            />
            <div>
              <p className="text-xs font-medium tracking-widest text-emerald-300 uppercase">
                {aiAgent.status === "analyzing"
                  ? "ANALYZING"
                  : aiAgent.status === "executing"
                  ? "EXECUTING"
                  : aiAgent.status === "error"
                  ? "ERROR"
                  : "READY"}
              </p>
          <p className="text-[11px] text-white/50 min-h-[16px]">
                {aiAgent.currentTask ? (
                  <span className="inline-flex items-center gap-1">
                    {aiAgent.currentTask}
                    <span className="inline-block h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
                  </span>
                ) : (
                  "Awaiting command...  "
                )}
              </p>
            </div>
          </div>
          {aiAgent.status === "analyzing" || aiAgent.status === "executing" ? (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${aiAgent.progress}%` }}
              className="h-2 rounded-full bg-emerald-400/20 overflow-hidden"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </motion.div>
          ) : null}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold tracking-widest text-emerald-400/60 uppercase">
              Activity
            </p>
            {aiAgent.activities.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearAIActivities}
                className="text-[10px] text-emerald-400/70 hover:text-emerald-300 transition-colors"
              >
                Clear all
              </motion.button>
            )}
          </div>
          <AnimatePresence mode="popLayout">
            {aiAgent.activities.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-white/30 text-sm"
              >
                No activity yet. Ask the agent to start.
              </motion.div>
            ) : (
              aiAgent.activities.slice(-20).map((activity, index) => (
                <motion.div
                  key={`${activity.timestamp}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div
                    className={`flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full ${
                      activity.status === "completed"
                        ? "bg-emerald-500/20"
                        : activity.status === "running"
                        ? "bg-emerald-500/20 animate-pulse"
                        : activity.status === "failed"
                        ? "bg-red-500/20"
                        : "bg-white/10"
                    }`}
                  >
                    {activity.status === "completed" && (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    )}
                    {activity.status === "running" && (
                      <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" />
                    )}
                    {activity.status === "failed" && (
                      <AlertCircle className="w-3 h-3 text-red-400" />
                    )}
                    {activity.status === "pending" && (
                      <Zap className="w-3 h-3 text-white/50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/90">{activity.action}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-white/40">
                        {new Date(activity.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                      {activity.progress !== undefined && (
                        <span className="text-[10px] text-emerald-400/70">
                          {activity.progress}%
                        </span>
                      )}
                    </div>
                    {activity.details && (
                      <p className="mt-1 text-[11px] text-white/40 blur-[0.3px] opacity-90">
                        {activity.details}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <p className="text-[10px] font-semibold tracking-widest text-emerald-400/60 uppercase mb-3">
            Quick Actions
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleQuickAction(action.prompt)}
                className="rounded-lg border border-white/10 bg-white/5 p-3 text-left text-sm hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-all"
              >
                <p className="font-medium text-white">{action.label}</p>
                <p className="mt-1 text-[11px] text-white/40 truncate">
                  {action.prompt}
                </p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-emerald-900/30 p-4">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSubmit(e))
            }
            placeholder="Ask GTrade Agent..."
            className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
            disabled={
              aiAgent.status === "analyzing" || aiAgent.status === "executing"
            }
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={
              !inputValue.trim() ||
              aiAgent.status === "analyzing" ||
              aiAgent.status === "executing"
            }
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-emerald-500 text-black disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            aria-label="Send"
          >
            <Zap className="w-4 h-4" />
          </motion.button>
        </div>
        <p className="mt-2 text-[10px] text-white/30 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </form>
    </motion.aside>
  );
}