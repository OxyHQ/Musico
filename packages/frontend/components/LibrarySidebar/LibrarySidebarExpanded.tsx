import React from 'react';
import { StyleSheet, View } from 'react-native';
import LibraryScreen from '@/app/library';

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
 * Uses the LibraryScreen component directly for consistent UI
 * Works in both expanded sidebar and fullscreen modes
 */
export const LibrarySidebarExpanded: React.FC<LibrarySidebarExpandedProps> = ({
  isFullscreen,
  onFullscreen,
  onCollapse,
}) => {
  return (
    <View style={styles.container}>
      <LibraryScreen
        showSidebarControls={true}
        isFullscreen={isFullscreen}
        onFullscreen={onFullscreen}
        onCollapse={onCollapse}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
  },
});
