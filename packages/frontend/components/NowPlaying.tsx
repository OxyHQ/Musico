import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useMediaQuery } from 'react-responsive';
import { usePlayerStore } from '@/stores/playerStore';
import { useUIStore } from '@/stores/uiStore';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { musicService } from '@/services/musicService';
import { Album, Artist, Track } from '@musico/shared-types';
import { MusicCard } from '@/components/MusicCard';
import { Avatar } from '@/components/Avatar';

/**
 * Now Playing Sidebar Component
 * Shows large background image, track info, and cards for artist, credits, queue
 * Collapsible and hidden on mobile/tablet
 */
export const NowPlaying: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const isDesktop = useMediaQuery({ minWidth: 1024 });
  const { isNowPlayingVisible, setNowPlayingVisible } = useUIStore();
  const { currentTrack, playTrack } = usePlayerStore();
  const [album, setAlbum] = useState<Album | null>(null);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [nextTracks, setNextTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  // Hide on mobile/tablet only
  if (!isDesktop) {
    return null;
  }

  // Fetch album and artist details if track exists
  useEffect(() => {
    const fetchDetails = async () => {
      if (currentTrack) {
        try {
          setLoading(true);
          const promises: Promise<any>[] = [];
          
          if (currentTrack.albumId) {
            promises.push(musicService.getAlbumById(currentTrack.albumId).then(data => setAlbum(data)));
          }
          
          if (currentTrack.artistId) {
            promises.push(musicService.getArtistById(currentTrack.artistId).then(data => setArtist(data)));
          }
          
          // Mock next tracks for now - will be replaced with queue API
          setNextTracks([]);
          
          await Promise.all(promises);
        } catch (error) {
          console.error('[NowPlaying] Error fetching details:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setAlbum(null);
        setArtist(null);
        setNextTracks([]);
      }
    };

    fetchDetails();
  }, [currentTrack?.id]);

  // Use album cover or artist image as background
  const backgroundImage = currentTrack?.coverArt || album?.coverArt || artist?.image;

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.background,
          width: isNowPlayingVisible ? 350 : 0,
        }
      ]}
    >
      {isNowPlayingVisible && (
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Now Playing</Text>
            <Pressable onPress={() => setNowPlayingVisible(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </Pressable>
          </View>

          {/* Now Playing Content */}
          {currentTrack ? (
            <View style={styles.nowPlayingContainer}>
              {/* Background Image Section */}
              <View style={styles.backgroundSection}>
                {backgroundImage ? (
                  <View style={styles.backgroundImageContainer}>
                    <ExpoImage
                      source={{ uri: backgroundImage }}
                      style={styles.backgroundImage}
                      contentFit="cover"
                    />
                    {/* Gradient Overlay */}
                    <View style={styles.gradientOverlay} />
                  </View>
                ) : (
                  <View style={[styles.backgroundPlaceholder, { backgroundColor: theme.colors.backgroundSecondary }]}>
                    <Ionicons name="musical-notes" size={80} color={theme.colors.textSecondary} />
                  </View>
                )}
                
                {/* Track Info Overlay at Bottom */}
                <View style={styles.trackInfoOverlay}>
                  <Text 
                    style={[styles.trackTitle, { color: '#fff' }]} 
                    numberOfLines={2}
                  >
                    {currentTrack.title}
                  </Text>
                  <Pressable
                    onPress={() => router.push(`/artist/${currentTrack.artistId}`)}
                    style={styles.artistPressable}
                  >
                    <Text 
                      style={[styles.trackArtist, { color: '#fff' }]} 
                      numberOfLines={1}
                    >
                      {currentTrack.artistName}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* About This Artist Card */}
              {artist && (
                <View style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary }]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: theme.colors.text }]}>About this artist</Text>
                  </View>
                  <Pressable
                    onPress={() => router.push(`/artist/${artist.id}`)}
                    style={styles.artistCard}
                  >
                    {artist.image ? (
                      <Avatar source={artist.image} size={80} />
                    ) : (
                      <View style={[styles.artistImagePlaceholder, { backgroundColor: theme.colors.background }]}>
                        <Ionicons name="person" size={40} color={theme.colors.textSecondary} />
                      </View>
                    )}
                    <View style={styles.artistCardInfo}>
                      <Text style={[styles.artistCardName, { color: theme.colors.text }]} numberOfLines={1}>
                        {artist.name}
                      </Text>
                      {artist.genre && artist.genre.length > 0 && (
                        <Text style={[styles.artistCardGenre, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                          {artist.genre[0]}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                </View>
              )}

              {/* Credits Card */}
              {album && (
                <View style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary }]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Credits</Text>
                  </View>
                  <View style={styles.creditsContent}>
                    <View style={styles.creditRow}>
                      <Text style={[styles.creditLabel, { color: theme.colors.textSecondary }]}>Album</Text>
                      <Pressable
                        onPress={() => router.push(`/album/${album.id}`)}
                        style={styles.creditValuePressable}
                      >
                        <Text style={[styles.creditValue, { color: theme.colors.text }]} numberOfLines={1}>
                          {album.title}
                        </Text>
                      </Pressable>
                    </View>
                    <View style={styles.creditRow}>
                      <Text style={[styles.creditLabel, { color: theme.colors.textSecondary }]}>Artist</Text>
                      <Pressable
                        onPress={() => router.push(`/artist/${album.artistId}`)}
                        style={styles.creditValuePressable}
                      >
                        <Text style={[styles.creditValue, { color: theme.colors.text }]} numberOfLines={1}>
                          {album.artistName}
                        </Text>
                      </Pressable>
                    </View>
                    {album.releaseDate && (
                      <View style={styles.creditRow}>
                        <Text style={[styles.creditLabel, { color: theme.colors.textSecondary }]}>Released</Text>
                        <Text style={[styles.creditValue, { color: theme.colors.text }]}>
                          {new Date(album.releaseDate).getFullYear()}
                        </Text>
                      </View>
                    )}
                    {album.label && (
                      <View style={styles.creditRow}>
                        <Text style={[styles.creditLabel, { color: theme.colors.textSecondary }]}>Label</Text>
                        <Text style={[styles.creditValue, { color: theme.colors.text }]} numberOfLines={1}>
                          {album.label}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Next in Queue Card */}
              <View style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Next in queue</Text>
                </View>
                {nextTracks.length > 0 ? (
                  <View style={styles.queueContent}>
                    {nextTracks.slice(0, 5).map((track, index) => (
                      <Pressable
                        key={track.id}
                        onPress={() => playTrack(track)}
                        style={styles.queueItem}
                      >
                        {track.coverArt ? (
                          <ExpoImage
                            source={{ uri: track.coverArt }}
                            style={styles.queueItemImage}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={[styles.queueItemImagePlaceholder, { backgroundColor: theme.colors.background }]}>
                            <Ionicons name="musical-notes" size={16} color={theme.colors.textSecondary} />
                          </View>
                        )}
                        <View style={styles.queueItemInfo}>
                          <Text style={[styles.queueItemTitle, { color: theme.colors.text }]} numberOfLines={1}>
                            {track.title}
                          </Text>
                          <Text style={[styles.queueItemArtist, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                            {track.artistName}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyQueue}>
                    <Text style={[styles.emptyQueueText, { color: theme.colors.textSecondary }]}>
                      Your queue is empty
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="musical-notes-outline" size={48} color={theme.colors.textSecondary} style={styles.placeholderIcon} />
              <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
                No track playing
              </Text>
              <Text style={[styles.placeholderSubtext, { color: theme.colors.textSecondary }]}>
                Start playing a song to see it here
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        top: 64,
        height: 'calc(100vh - 64px)',
        overflowY: 'auto' as any,
      },
      default: {
        flex: 1,
      },
    }),
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  nowPlayingContainer: {
    width: '100%',
  },
  backgroundSection: {
    width: '100%',
    height: 400,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundImageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
    ...Platform.select({
      web: {
        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
      },
      default: {},
    }),
  },
  backgroundPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 24,
  },
  trackTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  artistPressable: {
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  trackArtist: {
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    padding: 16,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  artistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  artistImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistCardInfo: {
    flex: 1,
    minWidth: 0,
  },
  artistCardName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  artistCardGenre: {
    fontSize: 14,
  },
  creditsContent: {
    gap: 12,
  },
  creditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  creditLabel: {
    fontSize: 13,
    fontWeight: '500',
    minWidth: 70,
  },
  creditValuePressable: {
    flex: 1,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  creditValue: {
    fontSize: 13,
    textAlign: 'right',
  },
  queueContent: {
    gap: 8,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  queueItemImage: {
    width: 48,
    height: 48,
    borderRadius: 4,
    overflow: 'hidden',
  },
  queueItemImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueItemInfo: {
    flex: 1,
    minWidth: 0,
  },
  queueItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  queueItemArtist: {
    fontSize: 13,
  },
  emptyQueue: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyQueueText: {
    fontSize: 14,
  },
  placeholder: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  placeholderIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.7,
  },
});
