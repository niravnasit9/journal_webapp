import { create } from 'zustand';

interface UiState {
  activeWorkspace: "GLOBAL" | "DOMESTIC";
  setWorkspace: (workspace: "GLOBAL" | "DOMESTIC") => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeWorkspace: "GLOBAL",
  setWorkspace: (workspace) => set({ activeWorkspace: workspace }),
}));
