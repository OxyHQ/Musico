import { create } from 'zustand';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { Track, PlaybackContext, RepeatMode } from '@musico/shared-types';
import { getApiOrigin } from '@/utils/api';
import { useQueueStore } from './queueStore';

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  player: AudioPlayer | null;
  error: string | null;
  context: PlaybackContext | null;
  
  // Actions
  playTrack: (track: Track, context?: PlaybackContext, addToQueue?: boolean) => Promise<void>;
  playFromQueue: (index: number) => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  setVolume: (volume: number) => void;
  stop: () => Promise<void>;
  updateCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  handleTrackCompletion: () => Promise<void>;
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
    context: null,

    playTrack: async (track: Track, context?: PlaybackContext, addToQueue: boolean = false) => {
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
              // Handle track completion - auto-play next if in queue
              get().handleTrackCompletion();
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
            context: context || null,
          });

          // Add to queue if requested
          if (addToQueue) {
            const queueStore = useQueueStore.getState();
            await queueStore.addToQueue([track.id], 'last');
          } else {
            // Update queue current index if track is in queue
            const queueStore = useQueueStore.getState();
            const queue = queueStore.queue;
            if (queue) {
              const trackIndex = queue.tracks.findIndex(t => t.id === track.id);
              if (trackIndex >= 0) {
                await queueStore.setCurrentIndex(trackIndex);
              }
            }
          }

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

    playFromQueue: async (index: number) => {
      const queueStore = useQueueStore.getState();
      const queue = queueStore.queue;
      
      if (!queue || index < 0 || index >= queue.tracks.length) {
        console.error('[PlayerStore] Invalid queue index:', index);
        return;
      }

      const track = queue.tracks[index];
      await queueStore.setCurrentIndex(index);
      await get().playTrack(track, queue.context, false);
    },

    playNext: async () => {
      const queueStore = useQueueStore.getState();
      await queueStore.playNext();
      
      const queue = queueStore.queue;
      if (queue && queue.current >= 0 && queue.current < queue.tracks.length) {
        const nextTrack = queue.tracks[queue.current];
        await get().playTrack(nextTrack, queue.context, false);
      }
    },

    playPrevious: async () => {
      const queueStore = useQueueStore.getState();
      await queueStore.playPrevious();
      
      const queue = queueStore.queue;
      if (queue && queue.current >= 0 && queue.current < queue.tracks.length) {
        const prevTrack = queue.tracks[queue.current];
        await get().playTrack(prevTrack, queue.context, false);
      }
    },

    handleTrackCompletion: async () => {
      const queueStore = useQueueStore.getState();
      const queue = queueStore.queue;
      const { repeat, shuffle } = queueStore;

      // Stop current track
      await get().stop();

      if (!queue || queue.tracks.length === 0) {
        return;
      }

      const currentIndex = queue.current;
      
      // Handle repeat modes
      if (repeat === RepeatMode.ONE) {
        // Repeat same track
        if (currentIndex >= 0 && currentIndex < queue.tracks.length) {
          const track = queue.tracks[currentIndex];
          await get().playTrack(track, queue.context, false);
        }
        return;
      }

      // Check if there's a next track
      const nextIndex = currentIndex + 1;
      if (nextIndex < queue.tracks.length) {
        // Play next track
        await get().playFromQueue(nextIndex);
      } else if (repeat === RepeatMode.ALL) {
        // Loop to beginning
        await get().playFromQueue(0);
      }
      // If repeat is OFF and no next track, just stop
    },
  };
});

