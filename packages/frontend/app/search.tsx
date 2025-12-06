import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Text, ScrollView, Platform, Pressable, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import SEO from '@/components/SEO';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SearchCategory, SearchResult, Track, Album, Artist, Playlist } from '@musico/shared-types';
import { searchService } from '@/services/searchService';
import { browseService, Genre } from '@/services/browseService';
import { MediaCard } from '@/components/MediaCard';
import { GenreCard } from '@/components/GenreCard';
import { TrackRow } from '@/components/TrackRow';
import { ExploreSection } from '@/components/ExploreSection';
import { usePlayerStore } from '@/stores/playerStore';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

/**
 * Musico Search Screen
 * Spotify-like search interface for tracks, albums, artists, and playlists
 */
const SearchScreen: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const { playTrack, currentTrack, isPlaying } = usePlayerStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>(SearchCategory.ALL);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Browse/Explore state
  const [genres, setGenres] = useState<Genre[]>([]);
  const [popularTracks, setPopularTracks] = useState<Track[]>([]);
  const [popularAlbums, setPopularAlbums] = useState<Album[]>([]);
  const [popularArtists, setPopularArtists] = useState<Artist[]>([]);
  const [madeForYouAlbums, setMadeForYouAlbums] = useState<Album[]>([]);
  const [madeForYouPlaylists, setMadeForYouPlaylists] = useState<Playlist[]>([]);
  const [chartsTracks, setChartsTracks] = useState<Track[]>([]);
  const [exploreLoading, setExploreLoading] = useState(false);

  // Debounce search query
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  // Fetch explore data when query is empty
  useEffect(() => {
    const fetchExploreData = async () => {
      if (searchQuery.trim().length > 0) {
        return; // Don't fetch explore data if there's a search query
      }

      setExploreLoading(true);
      try {
        const [
          genresResponse,
          popularTracksResponse,
          popularAlbumsResponse,
          popularArtistsResponse,
          madeForYouResponse,
          chartsResponse,
        ] = await Promise.all([
          browseService.getGenres(),
          browseService.getPopularTracks({ limit: 6 }),
          browseService.getPopularAlbums({ limit: 8 }),
          browseService.getPopularArtists({ limit: 8 }),
          browseService.getMadeForYou({ limit: 8 }),
          browseService.getCharts({ limit: 10 }),
        ]);

        setGenres(genresResponse.genres);
        setPopularTracks(popularTracksResponse.tracks);
        setPopularAlbums(popularAlbumsResponse.albums);
        setPopularArtists(popularArtistsResponse.artists);
        setMadeForYouAlbums(madeForYouResponse.albums);
        setMadeForYouPlaylists(madeForYouResponse.playlists);
        setChartsTracks(chartsResponse.tracks);
      } catch (error) {
        console.error('[Search] Error fetching explore data:', error);
      } finally {
        setExploreLoading(false);
      }
    };

    fetchExploreData();
  }, [searchQuery]);

  // Perform search when debounced query or category changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setSearchResults(null);
        return;
      }

      setLoading(true);
      try {
        const results = await searchService.search(debouncedQuery, {
          category: activeCategory,
          limit: 20,
          offset: 0,
        });
        setSearchResults(results);
      } catch (error) {
        console.error('[Search] Error performing search:', error);
        setSearchResults(null);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, activeCategory]);

  const handleTrackPress = (track: Track) => {
    playTrack(track);
  };

  const handleTrackRowPress = (track: Track) => {
    if (track.albumId) {
      router.push(`/album/${track.albumId}`);
    } else {
      playTrack(track);
    }
  };

  const handleGenreClick = (genreName: string) => {
    setSearchQuery(genreName);
  };

  const categories: { value: SearchCategory; label: string }[] = [
    { value: SearchCategory.ALL, label: 'All' },
    { value: SearchCategory.TRACKS, label: 'Tracks' },
    { value: SearchCategory.ALBUMS, label: 'Albums' },
    { value: SearchCategory.ARTISTS, label: 'Artists' },
    { value: SearchCategory.PLAYLISTS, label: 'Playlists' },
  ];

  const showResults = searchResults && debouncedQuery.trim().length > 0;
  const hasResults = searchResults && searchResults.counts.total > 0;

  return (
    <>
      <SEO
        title="Search - Musico"
        description="Search for music"
      />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Input */}
        <View style={styles.header}>
          <View style={[styles.searchContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <Ionicons name="search" size={24} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="What do you want to play?"
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* Category Tabs */}
        {searchQuery.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryTabs}
            contentContainerStyle={styles.categoryTabsContent}
          >
            {categories.map((category) => (
              <Pressable
                key={category.value}
                onPress={() => setActiveCategory(category.value)}
                style={[
                  styles.categoryTab,
                  activeCategory === category.value && {
                    backgroundColor: theme.colors.primary + '20',
                    borderColor: theme.colors.primary,
                  },
                  !(activeCategory === category.value) && {
                    borderColor: 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    {
                      color: activeCategory === category.value
                        ? theme.colors.primary
                        : theme.colors.text,
                    },
                  ]}
                >
                  {category.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Loading State - Only show when searching */}
        {loading && searchQuery.length > 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}

        {/* Explore/Discovery View - No Query */}
        {searchQuery.length === 0 && (
          <View style={styles.exploreView}>
            {/* Browse All - Genre Cards */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Browse All
              </Text>
              {exploreLoading || genres.length === 0 ? (
                <View style={styles.sectionLoading}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
              ) : (
                <View style={styles.genreGrid}>
                  {genres.map((genre) => (
                    <View key={genre.name} style={styles.genreGridItem}>
                      <GenreCard
                        name={genre.name}
                        color={genre.color}
                        coverArt={genre.coverArt || undefined}
                        onPress={() => handleGenreClick(genre.name)}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Made for You */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Made for You
              </Text>
              {exploreLoading || (madeForYouAlbums.length === 0 && madeForYouPlaylists.length === 0) ? (
                <View style={styles.sectionLoading}>
                  {exploreLoading ? (
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                  ) : (
                    <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                      No recommendations available
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.grid}>
                  {madeForYouAlbums.map((album) => (
                    <View key={album.id} style={styles.gridItem}>
                      <MediaCard
                        title={album.title}
                        subtitle={album.artistName}
                        type="album"
                        imageUri={album.coverArt}
                        onPress={() => router.push(`/album/${album.id}`)}
                      />
                    </View>
                  ))}
                  {madeForYouPlaylists.map((playlist) => (
                    <View key={playlist.id} style={styles.gridItem}>
                      <MediaCard
                        title={playlist.name}
                        subtitle={`Playlist • ${playlist.trackCount || 0} songs`}
                        type="playlist"
                        imageUri={playlist.coverArt}
                        onPress={() => router.push(`/playlist/${playlist.id}`)}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Popular Tracks */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Popular Tracks
              </Text>
              {exploreLoading || popularTracks.length === 0 ? (
                <View style={styles.sectionLoading}>
                  {exploreLoading ? (
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                  ) : (
                    <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                      No tracks available
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.grid}>
                  {popularTracks.map((track) => (
                    <View key={track.id} style={styles.gridItem}>
                      <MediaCard
                        title={track.title}
                        subtitle={track.artistName}
                        type="track"
                        imageUri={track.coverArt}
                        onPress={() => handleTrackRowPress(track)}
                        onPlayPress={() => playTrack(track)}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Top Albums */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Top Albums
              </Text>
              {exploreLoading || popularAlbums.length === 0 ? (
                <View style={styles.sectionLoading}>
                  {exploreLoading ? (
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                  ) : (
                    <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                      No albums available
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.grid}>
                  {popularAlbums.map((album) => (
                    <View key={album.id} style={styles.gridItem}>
                      <MediaCard
                        title={album.title}
                        subtitle={album.artistName}
                        type="album"
                        imageUri={album.coverArt}
                        onPress={() => router.push(`/album/${album.id}`)}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Top Artists */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Top Artists
              </Text>
              {exploreLoading || popularArtists.length === 0 ? (
                <View style={styles.sectionLoading}>
                  {exploreLoading ? (
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                  ) : (
                    <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                      No artists available
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.grid}>
                  {popularArtists.map((artist) => (
                    <View key={artist.id} style={styles.gridItem}>
                      <MediaCard
                        title={artist.name}
                        subtitle="Artist"
                        type="artist"
                        shape="circle"
                        imageUri={artist.image}
                        onPress={() => router.push(`/artist/${artist.id}`)}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Charts */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Charts
              </Text>
              {exploreLoading || chartsTracks.length === 0 ? (
                <View style={styles.sectionLoading}>
                  {exploreLoading ? (
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                  ) : (
                    <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                      No charts available
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.trackList}>
                  {chartsTracks.map((track, index) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      index={index}
                      isCurrentTrack={currentTrack?.id === track.id}
                      isTrackPlaying={currentTrack?.id === track.id && isPlaying}
                      onPress={() => handleTrackRowPress(track)}
                      onPlayPress={() => handleTrackPress(track)}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Results */}
        {!loading && showResults && (
          <View style={styles.results}>
            {/* Tracks Section */}
            {(activeCategory === SearchCategory.ALL || activeCategory === SearchCategory.TRACKS) &&
              searchResults.results.tracks &&
              searchResults.results.tracks.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Tracks ({searchResults.counts.tracks})
                  </Text>
                  <View style={styles.trackList}>
                    {searchResults.results.tracks.map((track, index) => (
                      <TrackRow
                        key={track.id}
                        track={track}
                        index={index}
                        isCurrentTrack={currentTrack?.id === track.id}
                        isTrackPlaying={currentTrack?.id === track.id && isPlaying}
                        onPress={() => handleTrackRowPress(track)}
                        onPlayPress={() => handleTrackPress(track)}
                      />
                    ))}
                  </View>
                </View>
              )}

            {/* Albums Section */}
            {(activeCategory === SearchCategory.ALL || activeCategory === SearchCategory.ALBUMS) &&
              searchResults.results.albums &&
              searchResults.results.albums.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Albums ({searchResults.counts.albums})
                  </Text>
                  <View style={styles.grid}>
                    {searchResults.results.albums.map((album) => (
                      <View key={album.id} style={styles.gridItem}>
                        <MediaCard
                          title={album.title}
                          subtitle={album.artistName}
                          type="album"
                          imageUri={album.coverArt}
                          onPress={() => router.push(`/album/${album.id}`)}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              )}

            {/* Artists Section */}
            {(activeCategory === SearchCategory.ALL || activeCategory === SearchCategory.ARTISTS) &&
              searchResults.results.artists &&
              searchResults.results.artists.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Artists ({searchResults.counts.artists})
                  </Text>
                  <View style={styles.grid}>
                    {searchResults.results.artists.map((artist) => (
                      <View key={artist.id} style={styles.gridItem}>
                        <MediaCard
                          title={artist.name}
                          subtitle="Artist"
                          type="artist"
                          shape="circle"
                          imageUri={artist.image}
                          onPress={() => router.push(`/artist/${artist.id}`)}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              )}

            {/* Playlists Section */}
            {(activeCategory === SearchCategory.ALL || activeCategory === SearchCategory.PLAYLISTS) &&
              searchResults.results.playlists &&
              searchResults.results.playlists.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Playlists ({searchResults.counts.playlists})
                  </Text>
                  <View style={styles.grid}>
                    {searchResults.results.playlists.map((playlist) => (
                      <View key={playlist.id} style={styles.gridItem}>
                        <MediaCard
                          title={playlist.name}
                          subtitle={`Playlist • ${playlist.trackCount || 0} songs`}
                          type="playlist"
                          imageUri={playlist.coverArt}
                          onPress={() => router.push(`/playlist/${playlist.id}`)}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              )}

            {/* No Results */}
            {!hasResults && (
              <View style={styles.noResultsContainer}>
                <Text style={[styles.noResultsText, { color: theme.colors.textSecondary }]}>
                  No results found for "{debouncedQuery}"
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100, // Space for bottom player bar
  },
  header: {
    padding: 18,
    paddingBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 4,
    ...Platform.select({
      web: {
        maxWidth: 500,
      },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  categoryTabs: {
    maxHeight: 50,
    marginBottom: 12,
  },
  categoryTabsContent: {
    paddingHorizontal: 18,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  exploreView: {
    paddingHorizontal: 18,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  genreGridItem: {
    paddingHorizontal: 6,
    paddingBottom: 12,
    ...Platform.select({
      web: {
        width: '25%', // 4 columns on desktop
        minWidth: 160,
        maxWidth: 240,
      },
      default: {
        width: '50%', // 2 columns on mobile
      },
    }),
  },
  results: {
    paddingHorizontal: 18,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  trackList: {
    gap: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  gridItem: {
    paddingHorizontal: 4,
    paddingBottom: 16,
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
  noResultsContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    fontSize: 16,
    textAlign: 'center',
  },
  sectionLoading: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default SearchScreen;
