import { create } from 'zustand';

interface UIState {
  isNowPlayingVisible: boolean;
  toggleNowPlaying: () => void;
  setNowPlayingVisible: (visible: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isNowPlayingVisible: true, // Open by default
  toggleNowPlaying: () => set((state) => ({ isNowPlayingVisible: !state.isNowPlayingVisible })),
  setNowPlayingVisible: (visible: boolean) => set({ isNowPlayingVisible: visible }),
}));
