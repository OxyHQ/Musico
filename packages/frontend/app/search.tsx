import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Text, ScrollView, Platform, Pressable } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import SEO from '@/components/SEO';
import { Ionicons } from '@expo/vector-icons';

/**
 * Musico Search Screen
 * Spotify-like search interface for tracks, albums, artists, and playlists
 */
const SearchScreen: React.FC = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

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

        {searchQuery.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              Search for songs, artists, albums, or playlists
            </Text>
          </View>
        ) : (
          <View style={styles.results}>
            <Text style={[styles.resultsText, { color: theme.colors.text }]}>
              Results for "{searchQuery}"
            </Text>
            {/* Search results will be displayed here */}
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
  emptyState: {
    flex: 1,
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  results: {
    padding: 18,
  },
  resultsText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default SearchScreen;

