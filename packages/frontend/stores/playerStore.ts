import { create } from 'zustand';
import { AudioPlayer } from 'expo-audio';
import { Track } from '@musico/shared-types';
import { getApiOrigin } from '@/utils/api';

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  player: AudioPlayer | null;
  error: string | null;
  
  // Actions
  playTrack: (track: Track) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  setVolume: (volume: number) => void;
  stop: () => Promise<void>;
  updateCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  let positionUpdateInterval: NodeJS.Timeout | null = null;

  const startPositionUpdates = (player: AudioPlayer) => {
    if (positionUpdateInterval) {
      clearInterval(positionUpdateInterval);
    }
    
    positionUpdateInterval = setInterval(() => {
      try {
        const status = player.status;
        if (status.isLoaded) {
          set({ 
            currentTime: status.currentTime / 1000, // Convert to seconds
            duration: status.duration ? status.duration / 1000 : get().duration,
            isPlaying: status.isPlaying || false,
          });
        }
      } catch (error) {
        console.error('[PlayerStore] Error updating position:', error);
      }
    }, 100); // Update every 100ms
  };

  const stopPositionUpdates = () => {
    if (positionUpdateInterval) {
      clearInterval(positionUpdateInterval);
      positionUpdateInterval = null;
    }
  };

  return {
    currentTrack: null,
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    volume: 1.0,
    player: null,
    error: null,

    playTrack: async (track: Track) => {
      try {
        console.log('[PlayerStore] Playing track:', track.title, track.audioSource.url);
        set({ isLoading: true, error: null, currentTrack: track }); // Set track immediately so player shows

        // Stop current track if playing
        const { player: currentPlayer, stop } = get();
        if (currentPlayer) {
          await stop();
        }

        // Resolve audio URL
        let audioUrl = track.audioSource.url;
        if (audioUrl.startsWith('/')) {
          // Relative URL - prepend API origin
          audioUrl = `${getApiOrigin()}${audioUrl}`;
        }
        console.log('[PlayerStore] Audio URL:', audioUrl);

        // Create new audio player
        const player = new AudioPlayer();
        
        // Set volume
        player.volume = get().volume;

        // Set up event listeners
        const statusListener = player.addListener('statusChange', (status) => {
          console.log('[PlayerStore] Status changed:', status);
          if (status.isLoaded) {
            if (status.didJustFinish) {
              get().stop();
            } else {
              set({
                isPlaying: status.isPlaying || false,
                currentTime: status.currentTime ? status.currentTime / 1000 : 0,
                duration: status.duration ? status.duration / 1000 : get().duration,
              });
            }
          }
        });

        // Set player immediately
        set({ 
          player,
          isLoading: true,
          currentTime: 0,
          duration: track.duration || 0,
        });

        // Load and play the audio
        try {
          console.log('[PlayerStore] Replacing audio source with:', audioUrl);
          await player.replace(audioUrl);
          console.log('[PlayerStore] Replace succeeded, status:', player.status);
          
          // Wait a bit for the audio to load
          await new Promise(resolve => setTimeout(resolve, 300));
          
          console.log('[PlayerStore] Calling player.play()');
          await player.play();
          console.log('[PlayerStore] Player.play() succeeded, status:', player.status);
          
          // Wait a bit more for status to update
          await new Promise(resolve => setTimeout(resolve, 200));
          
          const status = player.status;
          console.log('[PlayerStore] Player status after play:', status);
          
          const duration = track.duration || (status?.isLoaded && status?.duration 
            ? status.duration / 1000 
            : 0);

          set({ 
            isPlaying: true,
            isLoading: false,
            duration,
          });

          startPositionUpdates(player);
        } catch (playError) {
          console.error('[PlayerStore] Error playing:', playError);
          // Still show the track so player bar is visible, even if play failed
          set({ 
            isPlaying: false,
            isLoading: false,
            error: playError instanceof Error ? playError.message : 'Failed to play audio',
          });
          throw playError;
        }
      } catch (error) {
        console.error('[PlayerStore] Error playing track:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to play track',
          isLoading: false,
          isPlaying: false,
        });
      }
    },

    pause: async () => {
      const { player } = get();
      if (player) {
        await player.pause();
        set({ isPlaying: false });
      }
    },

    resume: async () => {
      const { player } = get();
      if (player) {
        await player.play();
        set({ isPlaying: true });
      }
    },

    seek: async (position: number) => {
      const { player } = get();
      if (player) {
        await player.seekTo(position * 1000); // Convert to milliseconds
        set({ currentTime: position });
      }
    },

    setVolume: (volume: number) => {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      set({ volume: clampedVolume });
      const { player } = get();
      if (player) {
        player.volume = clampedVolume;
      }
    },

    stop: async () => {
      stopPositionUpdates();
      const { player } = get();
      if (player) {
        player.removeAllListeners();
        await player.remove();
      }
      set({ 
        player: null,
        currentTrack: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        error: null,
      });
    },

    updateCurrentTime: (time: number) => {
      set({ currentTime: time });
    },

    setDuration: (duration: number) => {
      set({ duration });
    },
  };
});

