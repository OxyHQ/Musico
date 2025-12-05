import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Octicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface LibrarySidebarCollapsedProps {
  onExpand: () => void;
}

/**
 * Library Sidebar Collapsed View
 * Minimal icon-only sidebar when collapsed
 */
export const LibrarySidebarCollapsed: React.FC<LibrarySidebarCollapsedProps> = ({ onExpand }) => {
  const router = useRouter();
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={onExpand}
          style={styles.expandButton}
        >
          <Octicons
            name="sidebar-expand"
            size={20}
            color={theme.colors.text}
          />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Pressable
          style={[styles.likedIcon, { backgroundColor: '#450af5' }]}
          onPress={() => router.push('/library')}
        >
          <Ionicons name="heart" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    padding: 12,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  expandButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    padding: 0,
    margin: 0,
  },
  likedIcon: {
    width: 40,
    height: 40,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    margin: 0,
  },
});

