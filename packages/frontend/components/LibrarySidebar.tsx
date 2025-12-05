import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, TextInput, Platform, ViewStyle } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useOxy } from '@oxyhq/services';
import { Ionicons } from '@expo/vector-icons';
import { useMediaQuery } from 'react-responsive';

/**
 * Library Sidebar Component
 * Spotify-like "Your Library" sidebar with filters and library items
 */
export const LibrarySidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const { user, isAuthenticated } = useOxy();
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  
  const [isExpanded, setIsExpanded] = useState(!isMobile);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'Playlists' | 'Artists' | 'Albums' | 'Podcasts'>('Playlists');

  if (isMobile) {
    // On mobile, sidebar should be a drawer/overlay
    // For now, return null - will be implemented as drawer later
    return null;
  }

  const sidebarWidth = isExpanded ? 330 : 72;

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.background,
          width: sidebarWidth,
        }
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
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
            <Ionicons 
              name={isExpanded ? 'chevron-back' : 'chevron-forward'} 
              size={24} 
              color={theme.colors.text} 
            />
          </Pressable>
        </View>
        {isExpanded && (
          <Text style={[styles.title, { color: theme.colors.text }]}>Your Library</Text>
        )}
      </View>

      {isExpanded && (
        <>
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
          <ScrollView style={styles.libraryList} showsVerticalScrollIndicator={false}>
            {/* Liked Songs */}
            <Pressable 
              style={[styles.libraryItem, pathname === '/library/liked' && styles.activeItem]}
              onPress={() => router.push('/library/liked')}
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
        </>
      )}

      {/* Collapsed view - just icons */}
      {!isExpanded && (
        <View style={styles.collapsedView}>
          <Pressable 
            style={styles.collapsedItem}
            onPress={() => router.push('/library/liked')}
          >
            <View style={[styles.likedIconSmall, { backgroundColor: '#450af5' }]}>
              <Ionicons name="heart" size={20} color="#FFFFFF" />
            </View>
          </Pressable>
        </View>
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
        top: 64, // Below top bar
        height: 'calc(100vh - 64px)',
        overflowY: 'auto' as any,
      },
      default: {
        flex: 1,
      },
    }),
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    padding: 12,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  filtersContainer: {
    marginHorizontal: 8,
    marginBottom: 8,
    maxHeight: 32,
  },
  filtersContent: {
    paddingHorizontal: 8,
    gap: 6,
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
    whiteSpace: 'nowrap' as any,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
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
    paddingHorizontal: 8,
  },
  libraryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 5,
    borderRadius: 4,
    marginBottom: 4,
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
    padding: 8,
    alignItems: 'center',
  },
  collapsedItem: {
    marginBottom: 8,
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

