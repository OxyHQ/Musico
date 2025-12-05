import React from 'react';
import { StyleSheet, View, Text, Image, Pressable, Platform, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

interface MusicCardProps {
  title: string;
  subtitle?: string;
  imageUri?: string;
  type?: 'playlist' | 'album' | 'artist' | 'podcast' | 'track';
  onPress?: () => void;
}

/**
 * Music Card Component
 * Spotify-like card for displaying playlists, albums, artists
 */
export const MusicCard: React.FC<MusicCardProps> = ({ 
  title, 
  subtitle, 
  imageUri, 
  type = 'playlist',
  onPress 
}) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = React.useState(false);

  const getIcon = () => {
    switch (type) {
      case 'artist':
        return 'person';
      case 'podcast':
        return 'mic';
      default:
        return 'musical-notes';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={[
        styles.container,
        isHovered && { backgroundColor: theme.colors.backgroundSecondary },
        ...Platform.select({
          web: [{ cursor: 'pointer' as any }],
          default: [],
        }),
      ]}
    >
      {/* Image/Icon */}
      <View style={[styles.imageContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
        {imageUri ? (
          <Image 
            source={{ uri: imageUri }} 
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.iconContainer}>
            <Ionicons name={getIcon()} size={48} color={theme.colors.textSecondary} />
          </View>
        )}
        {/* Play button overlay on hover */}
        {isHovered && (
          <View style={styles.playOverlay}>
            <View style={[styles.playButton, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="play" size={24} color="#FFFFFF" />
            </View>
          </View>
        )}
      </View>

      {/* Text Content */}
      <View style={styles.textContainer}>
        <Text 
          style={[styles.title, { color: theme.colors.text }]} 
          numberOfLines={2}
        >
          {title}
        </Text>
        {subtitle && (
          <Text 
            style={[styles.subtitle, { color: theme.colors.textSecondary }]} 
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 6,
    borderRadius: 8,
    transition: 'background-color 0.2s',
    ...Platform.select({
      web: {
        minWidth: 0,
      },
    }),
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 6,
    position: 'relative',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  image: {
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: 8 }], // Slight offset like Spotify
  },
  textContainer: {
    minHeight: 42,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 18,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 16,
  },
});

