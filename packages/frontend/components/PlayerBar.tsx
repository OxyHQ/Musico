import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useMediaQuery } from 'react-responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayerStore } from '@/stores/playerStore';
import { useUIStore } from '@/stores/uiStore';
import { Image } from 'expo-image';

/**
 * Bottom Player Bar Component
 * Spotify-like bottom player bar showing currently playing track
 */
export const PlayerBar: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const [isExpanded, setIsExpanded] = useState(false);
  const { toggleNowPlaying } = useUIStore();
  
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    playTrack,
    pause,
    resume,
    seek,
  } = usePlayerStore();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      await pause();
    } else {
      await resume();
    }
  };

  const handleSeek = async (newPosition: number) => {
    await seek(newPosition);
  };

  const playerBarHeight = isMobile ? 60 + (Platform.OS === 'web' ? 0 : insets.bottom) : 72;

  // Always show player bar, even when no track is playing
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <View 
      style={[
        styles.container,
        { 
          backgroundColor: theme.colors.background,
          height: playerBarHeight,
          paddingBottom: isMobile ? insets.bottom : 0,
        }
      ]}
    >
      {/* Progress Bar */}
      <Pressable
        style={[styles.progressBarContainer, { backgroundColor: theme.colors.border }]}
        onPress={(e) => {
          if (Platform.OS === 'web') {
            const rect = (e.target as any)?.getBoundingClientRect();
            if (rect) {
              const x = e.nativeEvent.clientX - rect.left;
              const newPosition = (x / rect.width) * duration;
              handleSeek(newPosition);
            }
          }
        }}
      >
        <View 
          style={[
            styles.progressBar,
            { 
              backgroundColor: theme.colors.primary,
              width: `${progressPercent}%`,
            }
          ]} 
        />
      </Pressable>

      {/* Main Player Content */}
      <View style={styles.content}>
        {/* Left: Track Info */}
        <View style={styles.trackInfo}>
          <Pressable
            onPress={() => {
              const isDesktop = !isMobile;
              if (isDesktop && currentTrack) {
                toggleNowPlaying();
              }
            }}
            style={styles.albumArtPressable}
          >
            {currentTrack?.coverArt ? (
              <Image
                source={{ uri: currentTrack.coverArt }}
                style={styles.albumArt}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.albumArtPlaceholder, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <Ionicons name="musical-notes" size={24} color={theme.colors.textSecondary} />
              </View>
            )}
          </Pressable>
          <View style={styles.trackDetails}>
            <Text 
              style={[styles.trackTitle, { color: theme.colors.text }]} 
              numberOfLines={1}
            >
              {currentTrack?.title || (isLoading ? 'Loading...' : 'No track selected')}
            </Text>
            <Text 
              style={[styles.trackArtist, { color: theme.colors.textSecondary }]} 
              numberOfLines={1}
            >
              {currentTrack?.artistName || (isLoading ? '' : 'Choose a track to play')}
            </Text>
          </View>
          {!isMobile && (
            <Pressable style={styles.likeButton}>
              <Ionicons name="heart-outline" size={20} color={theme.colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Center: Playback Controls */}
        <View style={styles.playbackControls}>
          {!isMobile && (
            <Pressable style={styles.controlButton}>
              <Ionicons name="shuffle-outline" size={20} color={theme.colors.textSecondary} />
            </Pressable>
          )}
          <Pressable style={styles.controlButton}>
            <Ionicons name="play-skip-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Pressable 
            style={[
              styles.playButton, 
              { 
                backgroundColor: currentTrack ? theme.colors.primary : theme.colors.backgroundSecondary,
                opacity: currentTrack ? 1 : 0.5,
              }
            ]}
            onPress={handlePlayPause}
            disabled={isLoading || !currentTrack}
          >
            {isLoading ? (
              <Ionicons name="hourglass-outline" size={24} color="#FFFFFF" />
            ) : (
              <Ionicons 
                name={isPlaying ? 'pause' : 'play'} 
                size={24} 
                color={currentTrack ? "#FFFFFF" : theme.colors.textSecondary}
              />
            )}
          </Pressable>
          <Pressable style={styles.controlButton}>
            <Ionicons name="play-skip-forward" size={24} color={theme.colors.text} />
          </Pressable>
          {!isMobile && (
            <Pressable style={styles.controlButton}>
              <Ionicons name="repeat-outline" size={20} color={theme.colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Right: Volume & Queue Controls */}
        {!isMobile && (
          <View style={styles.rightControls}>
            <Pressable style={styles.controlButton}>
              <Ionicons name="list-outline" size={20} color={theme.colors.textSecondary} />
            </Pressable>
            <View style={styles.volumeContainer}>
              <Ionicons name="volume-low" size={20} color={theme.colors.textSecondary} />
              <View style={[styles.volumeSlider, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <View 
                  style={[
                    styles.volumeProgress,
                    { backgroundColor: theme.colors.primary, width: '70%' }
                  ]} 
                />
              </View>
            </View>
            <Pressable style={styles.controlButton}>
              <Ionicons name="expand-outline" size={20} color={theme.colors.textSecondary} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      },
      default: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      },
    }),
  },
  progressBarContainer: {
    height: 4,
    width: '100%',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  progressBar: {
    height: '100%',
    ...Platform.select({
      web: {
        transition: 'width 0.1s linear',
      },
    }),
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 16,
  },
  trackInfo: {
    flex: 0.3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  albumArtPressable: {
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  albumArt: {
    width: 56,
    height: 56,
    borderRadius: 4,
    overflow: 'hidden',
  },
  albumArtPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackDetails: {
    flex: 1,
    minWidth: 0,
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 13,
  },
  likeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playbackControls: {
    flex: 0.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  controlButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  rightControls: {
    flex: 0.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    maxWidth: 120,
  },
  volumeSlider: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  volumeProgress: {
    height: '100%',
    borderRadius: 2,
  },
});

