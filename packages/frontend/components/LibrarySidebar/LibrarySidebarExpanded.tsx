import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, TextInput, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons, Octicons } from '@expo/vector-icons';
import { MediaCard } from '@/components/MediaCard';

interface LibrarySidebarExpandedProps {
  displayMode: 'list' | 'grid';
  searchQuery: string;
  activeFilter: 'Playlists' | 'Artists' | 'Albums' | 'Podcasts';
  isFullscreen: boolean;
  onFullscreen: () => void;
  onCollapse: () => void;
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: 'Playlists' | 'Artists' | 'Albums' | 'Podcasts') => void;
}

/**
 * Library Sidebar Expanded View
 * Shared component for both normal sidebar (list mode) and fullscreen (grid mode)
 */
export const LibrarySidebarExpanded: React.FC<LibrarySidebarExpandedProps> = ({
  displayMode,
  searchQuery,
  activeFilter,
  isFullscreen,
  onFullscreen,
  onCollapse,
  onSearchChange,
  onFilterChange,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  const isListMode = displayMode === 'list';
  const isGridMode = displayMode === 'grid';

  // Grid mode - full screen layout like library.tsx
  if (isGridMode) {
    return (
      <ScrollView 
        style={[styles.container, styles.containerGrid, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.contentContainerGrid}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerGrid}>
          <Text style={[styles.titleGrid, { color: theme.colors.text }]}>Your Library</Text>
          <View style={styles.headerActionsRight}>
            <Pressable
              onPress={onFullscreen}
              style={styles.fullscreenButton}
            >
              <Ionicons
                name={isFullscreen ? 'contract' : 'expand'}
                size={20}
                color={theme.colors.text}
              />
            </Pressable>
            <Pressable style={styles.iconButton}>
              <Ionicons name="search-outline" size={24} color={theme.colors.text} />
            </Pressable>
            <Pressable style={styles.iconButton}>
              <Ionicons name="reorder-three-outline" size={24} color={theme.colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersGrid}>
          {(['Playlists', 'Artists', 'Albums', 'Podcasts'] as const).map((filter) => (
            <Pressable
              key={filter}
              onPress={() => onFilterChange(filter)}
              style={[
                styles.filterButton,
                { backgroundColor: theme.colors.backgroundSecondary },
                activeFilter === filter && {
                  backgroundColor: theme.colors.primary + '20',
                  borderColor: theme.colors.primary,
                  borderWidth: 1,
                }
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: activeFilter === filter ? theme.colors.primary : theme.colors.text
                  }
                ]}
              >
                {filter}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Liked Songs - Full width card */}
        <Pressable 
          style={[styles.libraryItemGrid, { backgroundColor: theme.colors.backgroundSecondary }]}
          onPress={() => router.push('/library')}
        >
          <View style={[styles.likedIconGrid, { backgroundColor: '#450af5' }]}>
            <Ionicons name="heart" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.itemContent}>
            <Text style={[styles.itemTitle, { color: theme.colors.text }]}>Liked Songs</Text>
            <Text style={[styles.itemSubtitleGrid, { color: theme.colors.textSecondary }]}>
              Playlist • 0 songs
            </Text>
          </View>
        </Pressable>

        {/* Grid items will go here when we have actual library items */}
        {/* For now, show empty state */}
        <View style={styles.emptyStateGrid}>
          <Text style={[styles.emptyTextGrid, { color: theme.colors.textSecondary }]}>
            {activeFilter === 'Playlists' && 'No playlists yet'}
            {activeFilter === 'Artists' && 'No followed artists yet'}
            {activeFilter === 'Albums' && 'No saved albums yet'}
            {activeFilter === 'Podcasts' && 'No podcasts yet'}
          </Text>
        </View>
      </ScrollView>
    );
  }

  // List mode - sidebar layout
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable style={styles.createButton}>
            <Ionicons name="add" size={24} color={theme.colors.text} />
            <Text style={[styles.createText, { color: theme.colors.text }]}>Create</Text>
          </Pressable>
          <View style={styles.headerButtons}>
            <Pressable
              onPress={onFullscreen}
              style={styles.fullscreenButton}
            >
              <Ionicons
                name={isFullscreen ? 'contract' : 'expand'}
                size={20}
                color={theme.colors.text}
              />
            </Pressable>
            {!isFullscreen && (
              <Pressable
                onPress={onCollapse}
                style={styles.collapseButton}
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
        <Text style={[styles.title, { color: theme.colors.text }]}>Your Library</Text>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
        bounces={false}
      >
        {(['Playlists', 'Artists', 'Albums', 'Podcasts'] as const).map((filter) => (
          <Pressable
            key={filter}
            onPress={() => onFilterChange(filter)}
            style={[
              styles.filterButton,
              activeFilter === filter && {
                backgroundColor: theme.colors.primary + '20',
                borderColor: theme.colors.primary,
              }
            ]}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: activeFilter === filter ? theme.colors.primary : theme.colors.text
                }
              ]}
            >
              {filter}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Search and Sort */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search in Your Library"
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={onSearchChange}
          />
        </View>
        <Pressable style={styles.sortButton}>
          <Text style={[styles.sortText, { color: theme.colors.textSecondary }]}>Recents</Text>
          <Ionicons name="list" size={20} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      {/* Library Items */}
      <ScrollView style={styles.libraryList} showsVerticalScrollIndicator={false} contentContainerStyle={styles.libraryListContent}>
        {/* Liked Songs */}
        <Pressable
          style={[styles.libraryItem, pathname === '/library' && styles.activeItem]}
          onPress={() => router.push('/library')}
        >
          <View style={[styles.likedIcon, { backgroundColor: '#450af5' }]}>
            <Ionicons name="heart" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.itemContent}>
            <Text style={[styles.itemTitle, { color: theme.colors.text }]}>Liked Songs</Text>
            <Text style={[styles.itemSubtitle, { color: theme.colors.textSecondary }]}>
              Playlist • 0 songs
            </Text>
          </View>
        </Pressable>

        {/* Empty state */}
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            {activeFilter === 'Playlists' && 'No playlists yet'}
            {activeFilter === 'Artists' && 'No followed artists yet'}
            {activeFilter === 'Albums' && 'No saved albums yet'}
            {activeFilter === 'Podcasts' && 'No podcasts yet'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    gap: 12,
    padding: 12,
  },
  containerGrid: {
    flex: 1,
  },
  contentContainerGrid: {
    padding: 18,
    paddingBottom: 100, // Space for bottom player bar
  },
  header: {
    width: '100%',
    gap: 8,
    padding: 0,
    margin: 0,
  },
  headerGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    width: '100%',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerTopGrid: {
    width: '100%',
    marginBottom: 0,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  createText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  fullscreenButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  collapseButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  titleGrid: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionsRight: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  filtersContainer: {
    maxHeight: 32,
    padding: 0,
  },
  filtersGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 18,
    alignItems: 'center',
  },
  filtersContent: {
    padding: 0,
    gap: 8,
    alignItems: 'center' as any,
  },
  filterButton: {
    paddingHorizontal: 13,
    paddingVertical: 4,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'transparent',
    height: 28,
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  filterButtonGrid: {
    // Same as filterButton for now
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: 0,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '600',
  },
  libraryList: {
    flex: 1,
    padding: 0,
  },
  libraryListContent: {
    gap: 8,
    padding: 0,
  },
  libraryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    borderRadius: 4,
    width: '100%',
  },
  activeItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  likedIcon: {
    width: 48,
    height: 48,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#450af5',
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
    fontSize: 13,
  },
  libraryGrid: {
    flex: 1,
    padding: 0,
  },
  libraryGridContent: {
    padding: 0,
  },
  libraryItemGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  likedIconGrid: {
    width: 64,
    height: 64,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemSubtitleGrid: {
    fontSize: 14,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateGrid: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyTextGrid: {
    fontSize: 16,
    textAlign: 'center',
  },
});

