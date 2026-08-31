import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WorkspaceId = 
  | 'command-center' 
  | 'backtest' 
  | 'strategies' 
  | 'analytics' 
  | 'research' 
  | 'settings';

export type AIStatus = 'ready' | 'analyzing' | 'executing' | 'idle' | 'error';

export interface AIActivity {
  timestamp: string;
  action: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  details?: string;
}

export interface AIState {
  status: AIStatus;
  currentTask?: string;
  progress: number;
  activities: AIActivity[];
  lastResult?: string;
}

export interface WorkspaceState {
  activeWorkspace: WorkspaceId;
  sidebarCollapsed: boolean;
  commandBarOpen: boolean;
  agentPanelOpen: boolean;
  aiAgent: AIState;
  setActiveWorkspace: (id: WorkspaceId) => void;
  toggleSidebar: () => void;
  toggleCommandBar: () => void;
  setCommandBarOpen: (open: boolean) => void;
  toggleAgentPanel: () => void;
  setAgentPanelOpen: (open: boolean) => void;
  setAIStatus: (status: AIStatus) => void;
  setAICurrentTask: (task: string) => void;
  setAIProgress: (progress: number) => void;
  addAIActivity: (activity: Omit<AIActivity, 'timestamp'>) => void;
  clearAIActivities: () => void;
  setAIResult: (result: string) => void;
  resetAI: () => void;
}

const initialAIState: AIState = {
  status: 'ready',
  progress: 0,
  activities: [],
  lastResult: undefined,
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      activeWorkspace: 'command-center',
      sidebarCollapsed: false,
      commandBarOpen: false,
      agentPanelOpen: true,
      aiAgent: initialAIState,

      setActiveWorkspace: (id) => set({ activeWorkspace: id }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleCommandBar: () => set((s) => ({ commandBarOpen: !s.commandBarOpen })),
      setCommandBarOpen: (open) => set({ commandBarOpen: open }),
      toggleAgentPanel: () => set((s) => ({ agentPanelOpen: !s.agentPanelOpen })),
      setAgentPanelOpen: (open) => set({ agentPanelOpen: open }),

      setAIStatus: (status) => set((s) => ({ aiAgent: { ...s.aiAgent, status } })),
      setAICurrentTask: (task) => set((s) => ({ aiAgent: { ...s.aiAgent, currentTask: task } })),
      setAIProgress: (progress) => set((s) => ({ aiAgent: { ...s.aiAgent, progress } })),

      addAIActivity: (activity) => set((s) => ({
        aiAgent: {
          ...s.aiAgent,
          activities: [...s.aiAgent.activities, { ...activity, timestamp: new Date().toISOString() }],
        },
      })),

      clearAIActivities: () => set((s) => ({
        aiAgent: { ...s.aiAgent, activities: [] },
      })),

      setAIResult: (result) => set((s) => ({
        aiAgent: { ...s.aiAgent, lastResult: result, status: 'ready', progress: 100 },
      })),

      resetAI: () => set({ aiAgent: initialAIState }),
    }),
    {
      name: 'gtrade-workspace',
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        activeWorkspace: s.activeWorkspace,
        agentPanelOpen: s.agentPanelOpen,
      }),
    }
  )
);