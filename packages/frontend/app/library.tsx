import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import SEO from '@/components/SEO';
import { Ionicons, Octicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface LibraryScreenProps {
  // Optional props for sidebar mode
  showSidebarControls?: boolean;
  isFullscreen?: boolean;
  onFullscreen?: () => void;
  onCollapse?: () => void;
}

/**
 * Musico Library Screen
 * User's music library (Liked Songs, Playlists, Artists, Albums)
 * Can be used as standalone screen or as sidebar component
 */
const LibraryScreen: React.FC<LibraryScreenProps> = ({
  showSidebarControls = false,
  isFullscreen = false,
  onFullscreen,
  onCollapse,
}) => {
  const theme = useTheme();
  const router = useRouter();

  return (
    <>
      {!showSidebarControls && (
        <SEO
          title="Your Library - Musico"
          description="Your music library"
        />
      )}
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Your Library</Text>
          <View style={styles.headerActions}>
            {showSidebarControls && onFullscreen && (
              <Pressable
                onPress={onFullscreen}
                style={styles.headerButton}
              >
                <Ionicons
                  name={isFullscreen ? 'contract' : 'expand'}
                  size={20}
                  color={theme.colors.text}
                />
              </Pressable>
            )}
            {showSidebarControls && onCollapse && !isFullscreen && (
              <Pressable
                onPress={onCollapse}
                style={styles.headerButton}
              >
                <Octicons
                  name="sidebar-collapse"
                  size={20}
                  color={theme.colors.text}
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          {['Playlists', 'Artists', 'Albums'].map((filter) => (
            <Pressable 
              key={filter}
              style={[
                styles.filterButton,
                { backgroundColor: theme.colors.backgroundSecondary }
              ]}
            >
              <Text style={[styles.filterText, { color: theme.colors.text }]}>{filter}</Text>
            </Pressable>
          ))}
        </View>

        {/* Liked Songs */}
        <Pressable 
          style={[styles.libraryItem, { backgroundColor: theme.colors.backgroundSecondary }]}
          onPress={() => router.push('/library/liked')}
        >
          <View style={[styles.likedIcon, { backgroundColor: '#450af5' }]}>
            <Ionicons name="heart" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.itemContent}>
            <Text style={[styles.itemTitle, { color: theme.colors.text }]}>Liked Songs</Text>
            <Text style={[styles.itemSubtitle, { color: theme.colors.textSecondary }]}>
              Playlist • 0 songs
            </Text>
          </View>
        </Pressable>

        {/* Empty state for playlists */}
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No playlists yet
          </Text>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 18,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  filters: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 18,
    alignItems: 'center',
  },
  filterButton: {
    paddingHorizontal: 13,
    paddingVertical: 4,
    borderRadius: 13,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 14,
  },
  libraryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  likedIcon: {
    width: 64,
    height: 64,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});

export default LibraryScreen;

