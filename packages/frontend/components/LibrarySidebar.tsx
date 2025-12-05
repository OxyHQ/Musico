import React, { useState } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { useMediaQuery } from 'react-responsive';
import { useUIStore } from '@/stores/uiStore';
import { LibrarySidebarCollapsed } from './LibrarySidebar/LibrarySidebarCollapsed';
import { LibrarySidebarExpanded } from './LibrarySidebar/LibrarySidebarExpanded';

/**
 * Library Sidebar Component
 * Container component that manages state and conditionally renders:
 * - Collapsed view (icon-only)
 * - Expanded view with list mode (normal sidebar)
 * - Expanded view with grid mode (fullscreen)
 */
export const LibrarySidebar: React.FC = () => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const { fullscreenPanel, toggleFullscreen } = useUIStore();

  const [isExpanded, setIsExpanded] = useState(!isMobile);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'Playlists' | 'Artists' | 'Albums' | 'Podcasts'>('Playlists');
  const isFullscreen = fullscreenPanel === 'library';

  // Hide on mobile
  if (isMobile) {
    return null;
  }

  // Determine display mode for expanded view
  const displayMode = isFullscreen ? 'grid' : 'list';

  return (
    <View style={styles.container}>
      {!isExpanded ? (
        <LibrarySidebarCollapsed onExpand={() => setIsExpanded(true)} />
      ) : (
        <LibrarySidebarExpanded
          displayMode={displayMode}
          searchQuery={searchQuery}
          activeFilter={activeFilter}
          isFullscreen={isFullscreen}
          onFullscreen={() => toggleFullscreen('library')}
          onCollapse={() => setIsExpanded(false)}
          onSearchChange={setSearchQuery}
          onFilterChange={setActiveFilter}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    overflowY: 'auto' as any,
    ...Platform.select({
      default: {
        flex: 1,
      },
    }),
  },
});
