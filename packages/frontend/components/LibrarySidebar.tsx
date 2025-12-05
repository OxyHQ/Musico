import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, TextInput, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons, Octicons } from '@expo/vector-icons';
import { useMediaQuery } from 'react-responsive';
/**
 * Library Sidebar Component
 * Spotify-like "Your Library" sidebar with filters and library items
 */
export const LibrarySidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery({ maxWidth: 767 });

  const [isExpanded, setIsExpanded] = useState(!isMobile);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'Playlists' | 'Artists' | 'Albums' | 'Podcasts'>('Playlists');

  if (isMobile) {
    // On mobile, sidebar should be a drawer/overlay
    // For now, return null - will be implemented as drawer later
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        !isExpanded && styles.containerCollapsed,
      ]}
    >
      {/* Header */}
      <View style={[
        styles.header,
        !isExpanded && styles.headerCollapsed
      ]}>
        <View style={[
          styles.headerTop,
          !isExpanded && styles.headerTopCollapsed
        ]}>
          {isExpanded && (
            <Pressable style={styles.createButton}>
              <Ionicons name="add" size={24} color={theme.colors.text} />
              <Text style={[styles.createText, { color: theme.colors.text }]}>Create</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => setIsExpanded(!isExpanded)}
            style={styles.expandButton}
          >
            <Octicons
              name={isExpanded ? 'sidebar-collapse' : 'sidebar-expand'}
              size={20}
              color={theme.colors.text}
            />
          </Pressable>
        </View>
        {isExpanded && (
          <Text style={[styles.title, { color: theme.colors.text }]}>Your Library</Text>
        )}
      </View>

      {isExpanded && (
        <View style={styles.expandedContent}>
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
                onPress={() => setActiveFilter(filter)}
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
                onChangeText={setSearchQuery}
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

            {/* Empty state for now */}
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
      )}

      {/* Collapsed view - just icons */}
      {!isExpanded && (
        <View style={styles.collapsedView}>
          <Pressable
            style={[styles.likedIconSmall, { backgroundColor: '#450af5' }]}
            onPress={() => router.push('/library')}
          >
            <Ionicons name="heart" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    overflowY: 'auto' as any,
    padding: 12,
    flexDirection: 'column',
    gap: 12,
    ...Platform.select({
      default: {
        flex: 1,
      },
    }),
  },
  containerCollapsed: {
    alignItems: 'center',
  },
  header: {
    width: '100%',
    gap: 8,
    padding: 0,
    margin: 0,
  },
  headerCollapsed: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  expandedContent: {
    flex: 1,
    gap: 8,
    width: '100%',
  },
  headerTopCollapsed: {
    justifyContent: 'center',
    width: '100%',
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
  expandButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    margin: 0,
    padding: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  filtersContainer: {
    maxHeight: 32,
    padding: 0,
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
  likedIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    margin: 0,
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
  collapsedView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    padding: 0,
    margin: 0,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

