import { create } from 'zustand';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
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
        if (player.isLoaded) {
          set({ 
            currentTime: player.currentTime || 0,
            duration: player.duration || get().duration,
            isPlaying: player.playing || false,
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

        // Create new audio player using createAudioPlayer function
        const player = createAudioPlayer(audioUrl, {
          updateInterval: 100, // Update every 100ms for smooth progress
        });
        
        // Set volume
        player.volume = get().volume;

        // Set up event listeners
        const statusListener = player.addListener('playbackStatusUpdate', (status) => {
          console.log('[PlayerStore] Status changed:', status);
          if (status.isLoaded) {
            if (status.didJustFinish) {
              get().stop();
            } else {
              set({
                isPlaying: status.playing || false,
                currentTime: status.currentTime || 0,
                duration: status.duration || get().duration,
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

        // Play the audio (createAudioPlayer auto-loads the source)
        try {
          console.log('[PlayerStore] Calling player.play()');
          player.play();
          console.log('[PlayerStore] Player.play() called, status:', {
            isLoaded: player.isLoaded,
            playing: player.playing,
            paused: player.paused,
          });
          
          // Wait a bit for the audio to load and start playing
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const duration = track.duration || (player.isLoaded && player.duration 
            ? player.duration 
            : 0);

          set({ 
            isPlaying: player.playing,
            isLoading: false,
            duration,
            currentTime: player.currentTime || 0,
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
        player.pause();
        set({ isPlaying: false });
      }
    },

    resume: async () => {
      const { player } = get();
      if (player) {
        player.play();
        set({ isPlaying: true });
      }
    },

    seek: async (position: number) => {
      const { player } = get();
      if (player) {
        await player.seekTo(position);
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
        player.remove();
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

