import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, ScrollView, Text, Pressable, Image, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { musicService } from '@/services/musicService';
import { Playlist, Track } from '@musico/shared-types';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '@/stores/playerStore';
import SEO from '@/components/SEO';
import { TrackRow } from '@/components/TrackRow';
import { formatDuration, formatTotalDuration } from '@/utils/musicUtils';

const HEADER_HEIGHT = 400;

/**
 * Playlist Screen
 * Displays playlist details with parallax header, gradient overlay, and track list
 */
const PlaylistScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { playTrack, currentTrack, isPlaying } = usePlayerStore();
  
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);

  useEffect(() => {
    if (id) {
      fetchPlaylistData();
    }
  }, [id]);

  const fetchPlaylistData = async () => {
    try {
      setLoading(true);
      const [playlistData, tracksData] = await Promise.all([
        musicService.getPlaylistById(id!),
        musicService.getPlaylistTracks(id!)
      ]);
      setPlaylist(playlistData);
      setTracks(tracksData.tracks);
    } catch (error) {
      console.error('[PlaylistScreen] Error fetching playlist:', error);
    } finally {
      setLoading(false);
    }
  };

  // Parallax animation for header image
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(scrollOffset.value, [-HEADER_HEIGHT, 0, HEADER_HEIGHT], [2, 1, 1]),
        },
      ],
    };
  });

  // Helper function to convert hex color to RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
      : null;
  };

  // Convert hex to rgba string for LinearGradient
  const hexToRgba = (hex: string, alpha: number = 0.2): string => {
    const rgb = hexToRgb(hex);
    if (!rgb) return `rgba(128, 128, 128, ${alpha})`; // Fallback gray
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  };

  // Get gradient colors from playlist dominantColor or fallback to theme primary
  const getGradientColors = (): string[] => {
    const topColor = playlist?.dominantColor 
      ? playlist.dominantColor
      : theme.colors.primary;
    return [topColor, theme.colors.background];
  };

  const handlePlayPlaylist = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0]);
    }
  };

  const handleTrackPress = (track: Track) => {
    playTrack(track);
  };

  const totalDurationFormatted = useMemo(() => {
    if (playlist?.totalDuration) {
      return formatTotalDuration(playlist.totalDuration);
    }
    return '';
  }, [playlist?.totalDuration]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!playlist) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.text }]}>Playlist not found</Text>
      </View>
    );
  }

  return (
    <>
      <SEO
        title={`${playlist.name} - Musico`}
        description={playlist.description || `Listen to ${playlist.name}`}
      />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Animated.ScrollView
          ref={scrollRef}
          scrollEventThrottle={16}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Parallax Header Section */}
          <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
            {playlist.coverArt ? (
              <Image
                source={{ uri: playlist.coverArt }}
                style={styles.headerImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.headerPlaceholder, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <Ionicons name="musical-notes" size={80} color={theme.colors.textSecondary} />
              </View>
            )}
            {/* Dark overlay for text readability */}
            <View style={styles.headerOverlay} />
            {/* Playlist Title */}
            <View style={styles.titleContainer}>
              <Text style={[styles.playlistTitle, { color: '#FFFFFF' }]} numberOfLines={2}>
                {playlist.name}
              </Text>
            </View>
          </Animated.View>

          {/* Content Section with Gradient Background */}
          <LinearGradient
            colors={getGradientColors()}
            locations={[0, 0.2]}
            style={styles.contentSection}
          >
            {/* Playlist Info */}
            <View style={styles.infoContainer}>
              {playlist.description && (
                <Text style={[styles.description, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                  {playlist.description}
                </Text>
              )}
              <View style={styles.metadataRow}>
                <Text style={[styles.metadata, { color: theme.colors.textSecondary }]}>
                  {playlist.ownerUsername}
                </Text>
                {playlist.trackCount > 0 && (
                  <>
                  <Text style={[styles.metadataSeparator, { color: theme.colors.textSecondary }]}>•</Text>
                  <Text style={[styles.metadata, { color: theme.colors.textSecondary }]}>
                    {playlist.trackCount} {playlist.trackCount === 1 ? 'song' : 'songs'}
                  </Text>
                  {totalDurationFormatted && (
                    <>
                      <Text style={[styles.metadataSeparator, { color: theme.colors.textSecondary }]}>•</Text>
                      <Text style={[styles.metadata, { color: theme.colors.textSecondary }]}>
                        {totalDurationFormatted}
                      </Text>
                    </>
                  )}
                  </>
                )}
                {playlist.followers !== undefined && playlist.followers > 0 && (
                  <>
                    <Text style={[styles.metadataSeparator, { color: theme.colors.textSecondary }]}>•</Text>
                    <Text style={[styles.metadata, { color: theme.colors.textSecondary }]}>
                      {playlist.followers.toLocaleString()} {playlist.followers === 1 ? 'save' : 'saves'}
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Playback Controls */}
            <View style={styles.controlsContainer}>
              <Pressable
                style={[styles.playButton, { backgroundColor: theme.colors.primary }]}
                onPress={handlePlayPlaylist}
              >
                <Ionicons name="play" size={28} color="#000" />
              </Pressable>

              <Pressable style={styles.controlButton}>
                <Ionicons name="shuffle" size={20} color={theme.colors.text} />
              </Pressable>

              <Pressable
                style={styles.controlButton}
                onPress={() => setIsLiked(!isLiked)}
              >
                <Ionicons
                  name={isLiked ? "heart" : "heart-outline"}
                  size={24}
                  color={isLiked ? theme.colors.primary : theme.colors.text}
                />
              </Pressable>

              <Pressable
                style={styles.controlButton}
                onPress={() => setIsDownloaded(!isDownloaded)}
              >
                <Ionicons
                  name={isDownloaded ? "arrow-down-circle" : "arrow-down-circle-outline"}
                  size={24}
                  color={theme.colors.text}
                />
              </Pressable>

              <Pressable style={styles.controlButton}>
                <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.text} />
              </Pressable>
            </View>

            {/* Divider */}
            <View style={[styles.divider, { borderBottomColor: theme.colors.backgroundSecondary }]} />

            {/* Track List Header */}
            <View style={styles.trackListHeader}>
              <View style={styles.trackListHeaderLeft}>
                <Text style={[styles.trackListHeaderText, { color: theme.colors.textSecondary }]}>#</Text>
                <Text style={[styles.trackListHeaderText, { color: theme.colors.textSecondary }]}>Title</Text>
              </View>
              <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
            </View>

            {/* Track List */}
            <View style={styles.trackList}>
              {tracks.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                    No tracks in this playlist
                  </Text>
                </View>
              ) : (
                tracks.map((track, index) => {
                  const isCurrentTrack = currentTrack?.id === track.id;
                  const isTrackPlaying = isCurrentTrack && isPlaying;
                  
                  return (
                    <TrackRow
                      key={track.id}
                      track={track}
                      index={index}
                      isCurrentTrack={isCurrentTrack}
                      isTrackPlaying={isTrackPlaying}
                      onPress={() => handleTrackPress(track)}
                      onPlayPress={() => handleTrackPress(track)}
                      showNumber={true}
                    />
                  );
                })
              )}
            </View>
          </LinearGradient>
        </Animated.ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
  },
  headerContainer: {
    height: HEADER_HEIGHT,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  titleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 32,
  },
  playlistTitle: {
    fontSize: 72,
    fontWeight: 'bold',
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  contentSection: {
    paddingTop: 24,
    minHeight: '100%',
  },
  infoContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metadata: {
    fontSize: 14,
  },
  metadataSeparator: {
    fontSize: 14,
    marginHorizontal: 8,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 12,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  controlButton: {
    padding: 8,
    borderRadius: 20,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  divider: {
    borderBottomWidth: 1,
    marginHorizontal: 24,
    marginBottom: 8,
  },
  trackListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderBottomWidth: 0,
  },
  trackListHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  trackListHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  trackList: {
    paddingHorizontal: 24,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
  },
});

export default PlaylistScreen;

