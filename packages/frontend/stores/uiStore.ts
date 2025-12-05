import { create } from 'zustand';

type FullscreenPanel = 'library' | 'nowPlaying' | null;

interface UIState {
  isNowPlayingVisible: boolean;
  toggleNowPlaying: () => void;
  setNowPlayingVisible: (visible: boolean) => void;
  fullscreenPanel: FullscreenPanel;
  setFullscreenPanel: (panel: FullscreenPanel) => void;
  toggleFullscreen: (panel: 'library' | 'nowPlaying') => void;
}

export const useUIStore = create<UIState>((set) => ({
  isNowPlayingVisible: true, // Open by default
  toggleNowPlaying: () => set((state) => ({ isNowPlayingVisible: !state.isNowPlayingVisible })),
  setNowPlayingVisible: (visible: boolean) => set({ isNowPlayingVisible: visible }),
  fullscreenPanel: null,
  setFullscreenPanel: (panel: FullscreenPanel) => set({ fullscreenPanel: panel }),
  toggleFullscreen: (panel: 'library' | 'nowPlaying') => set((state) => ({
    fullscreenPanel: state.fullscreenPanel === panel ? null : panel,
  })),
}));
