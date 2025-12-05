import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Text, Platform, Pressable, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useOxy } from '@oxyhq/services';
import { useRouter } from 'expo-router';
import SEO from '@/components/SEO';
import { MediaCard } from '@/components/MediaCard';
import { useMediaQuery } from 'react-responsive';
import { musicService } from '@/services/musicService';
import { Track } from '@musico/shared-types';
import { usePlayerStore } from '@/stores/playerStore';
import { Ionicons } from '@expo/vector-icons';

/**
 * Musico Home Screen
 * Spotify-like home screen with recently played, made for you, etc.
 */
const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const { isAuthenticated } = useOxy();
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  const [activeFilter, setActiveFilter] = useState<'All' | 'Music' | 'Podcasts' | 'Audiobooks'>('All');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack, currentTrack } = usePlayerStore();

  // Fetch tracks on mount
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        setLoading(true);
        const response = await musicService.getTracks({ limit: 20 });
        setTracks(response.tracks);
      } catch (error) {
        console.error('[HomeScreen] Error fetching tracks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, []);

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Helper to create a mock track from any item
  const createMockTrack = (item: { id: string; title: string; subtitle?: string }): Track => ({
    id: item.id,
    title: item.title,
    artistId: `artist-${item.id}`,
    artistName: item.subtitle || 'Various Artists',
    albumId: `album-${item.id}`,
    albumName: item.title,
    duration: 180,
    trackNumber: 1,
    audioSource: {
      url: '/api/audio/test-song.mp3',
      format: 'mp3',
      bitrate: 320,
      duration: 180,
    },
    coverArt: null,
    isExplicit: false,
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Mock data - will be replaced with actual API data
  // 8-item compact grid for recently played
  const quickAccess = [
    { id: '1', title: 'Benvinguts Al Club', type: 'album' as const, shape: 'square' as const },
    { id: '2', title: 'Reggaeton Mix', type: 'mix' as const, shape: 'circle' as const },
    { id: '3', title: 'ROSALÍA', type: 'artist' as const, shape: 'circle' as const, isPlaying: true },
    { id: '4', title: 'Beéle Mix', type: 'mix' as const, shape: 'circle' as const },
    { id: '5', title: 'ROSALÍA Mix', type: 'mix' as const, shape: 'circle' as const },
    { id: '6', title: 'MALAMENTE', type: 'album' as const, shape: 'square' as const },
    { id: '7', title: 'Drake', type: 'artist' as const, shape: 'circle' as const },
    { id: '8', title: 'LUX', type: 'album' as const, shape: 'square' as const },
  ];

  const recentlyPlayed = [
    { id: '1', title: 'Liked Songs', subtitle: 'Playlist', type: 'playlist' as const },
    { id: '2', title: 'Daily Mix 1', subtitle: 'Made for you', type: 'playlist' as const },
    { id: '3', title: 'Discover Weekly', subtitle: 'Made for you', type: 'playlist' as const },
    { id: '4', title: 'Release Radar', subtitle: 'New releases', type: 'playlist' as const },
  ];

  const madeForYou = [
    { id: '5', title: 'Time Capsule', subtitle: 'Made for you', type: 'playlist' as const },
    { id: '6', title: 'On Repeat', subtitle: 'Songs you love', type: 'playlist' as const },
    { id: '7', title: 'Chill Mix', subtitle: 'Made for you', type: 'playlist' as const },
    { id: '8', title: 'Rock Classics', subtitle: 'Hits from the 80s', type: 'playlist' as const },
  ];

  return (
    <>
      <SEO
        title="Musico - Music Streaming"
        description="Discover and play your favorite music"
      />
      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: 100 } // Space for bottom player bar
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {getGreeting()}
          </Text>
        </View>

        {/* Filter Chips */}
        <View style={styles.filtersContainer}>
          {(['All', 'Music', 'Podcasts', 'Audiobooks'] as const).map((filter) => (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: activeFilter === filter
                    ? theme.colors.primary + '20'
                    : theme.colors.backgroundSecondary,
                  borderColor: activeFilter === filter
                    ? theme.colors.primary
                    : 'transparent',
                }
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: activeFilter === filter
                      ? theme.colors.primary
                      : theme.colors.text
                  }
                ]}
              >
                {filter}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* 8-Item Compact Grid (2 columns) - Just image/icon and text */}
        <View style={styles.compactGrid}>
          {quickAccess.map((item) => {
            const mockTrack = createMockTrack(item);
            return (
              <Pressable
                key={item.id}
                style={[styles.compactGridItem, { backgroundColor: theme.colors.backgroundSecondary }]}
                onPress={() => {
                  // Navigate based on type
                  if (item.type === 'album' && mockTrack.albumId) {
                    router.push(`/album/${mockTrack.albumId}`);
                  } else if (item.type === 'playlist') {
                    router.push(`/playlist/${item.id}`);
                  } else if (item.type === 'artist') {
                    // Artist navigation handled gracefully (no page yet)
                    // Could navigate to artist page in future: router.push(`/artist/${mockTrack.artistId}`);
                  } else {
                    // For mixes and other types, just play for now
                    playTrack(mockTrack);
                  }
                }}
              >
                <View
                  style={[
                    styles.compactImageContainer,
                    {
                      backgroundColor: theme.colors.background,
                      borderRadius: item.shape === 'circle' ? 999 : 12,
                    }
                  ]}
                >
                  <Ionicons
                    name={item.type === 'artist' ? 'person' : item.type === 'mix' ? 'layers' : 'musical-notes'}
                    size={24}
                    color={theme.colors.textSecondary}
                  />
                </View>
                <Text
                  style={[styles.compactTitle, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Recently Played Section */}
        {recentlyPlayed.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Recently played
            </Text>
            <View style={styles.grid}>
              {recentlyPlayed.map((item) => {
                const mockTrack = createMockTrack(item);
                return (
                  <View
                    key={item.id}
                    style={styles.gridItem}
                  >
                    <MediaCard
                      title={item.title}
                      subtitle={item.subtitle}
                      type={item.type}
                      onPress={() => {
                        // Navigate to playlist page if it's a playlist
                        if (item.type === 'playlist') {
                          router.push(`/playlist/${item.id}`);
                        }
                      }}
                      onPlayPress={() => playTrack(mockTrack)}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Made for You Section */}
        {madeForYou.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Made for you
            </Text>
            <View style={styles.grid}>
              {madeForYou.map((item) => {
                const mockTrack = createMockTrack(item);
                return (
                  <View
                    key={item.id}
                    style={styles.gridItem}
                  >
                    <MediaCard
                      title={item.title}
                      subtitle={item.subtitle}
                      type={item.type}
                      onPress={() => {
                        // Navigate to playlist page if it's a playlist
                        if (item.type === 'playlist') {
                          router.push(`/playlist/${item.id}`);
                        }
                      }}
                      onPlayPress={() => playTrack(mockTrack)}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Tracks Section */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : tracks.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Tracks
            </Text>
            <View style={styles.grid}>
              {tracks.map((track) => (
                <View
                  key={track.id}
                  style={styles.gridItem}
                >
                  <MediaCard
                    title={track.title}
                    subtitle={track.artistName}
                    type="track"
                    onPress={() => {
                      // Navigate to album page if albumId exists
                      if (track.albumId) {
                        router.push(`/album/${track.albumId}`);
                      }
                    }}
                    onPlayPress={() => playTrack(track)}
                  />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    ...Platform.select({
      web: {
        maxWidth: '100%',
      },
    }),
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
    alignItems: 'center',
  },
  filterButton: {
    paddingHorizontal: 13,
    paddingVertical: 4,
    borderRadius: 13,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 14,
  },
  compactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 8,
  },
  compactGridItem: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    marginBottom: 4,
    alignItems: 'center',
    ...Platform.select({
      web: {
        width: 'calc(50% - 4px)',
      },
      default: {
        width: '48%',
      },
    }),
  },
  compactImageContainer: {
    width: 40,
    height: 40,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  compactTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  gridItem: {
    paddingHorizontal: 4,
    paddingBottom: 6,
    ...Platform.select({
      web: {
        width: '20%', // 5 columns on desktop
        minWidth: 180,
        maxWidth: 220,
      },
      default: {
        width: '50%', // 2 columns on mobile
      },
    }),
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomeScreen;
