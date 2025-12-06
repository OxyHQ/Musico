import React from 'react';
import { StyleSheet, View, Text, Pressable, Image, Platform, Alert } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useImagePicker, ImagePickerResult } from '@/hooks/useImagePicker';

interface CoverArtPickerProps {
  value?: string; // Image URI
  onChange: (uri: string | null) => void;
  size?: number;
  disabled?: boolean;
}

/**
 * Cover Art Picker Component
 * Allows users to select a cover image for playlists
 */
export const CoverArtPicker: React.FC<CoverArtPickerProps> = ({
  value,
  onChange,
  size = 200,
  disabled = false,
}) => {
  const theme = useTheme();
  const { pickImage, takePhoto } = useImagePicker({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  const handlePickImage = async () => {
    if (disabled) return;

    // Show action sheet to choose source
    if (Platform.OS === 'web') {
      // Web: Just open library picker
      const result = await pickImage('library');
      if (result) {
        onChange(result.uri);
      }
    } else {
      // Native: Show options
      Alert.alert(
        'Select Cover Art',
        'Choose an option',
        [
          {
            text: 'Photo Library',
            onPress: async () => {
              const result = await pickImage('library');
              if (result) {
                onChange(result.uri);
              }
            },
          },
          {
            text: 'Take Photo',
            onPress: async () => {
              const result = await takePhoto();
              if (result) {
                onChange(result.uri);
              }
            },
          },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => onChange(null),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    }
  };

  return (
    <Pressable
      onPress={handlePickImage}
      disabled={disabled}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor: theme.colors.backgroundSecondary,
          borderColor: theme.colors.border,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {value ? (
        <Image
          source={{ uri: value }}
          style={[styles.image, { width: size, height: size }]}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholder}>
          <MaterialCommunityIcons
            name="image-plus"
            size={size * 0.3}
            color={theme.colors.textSecondary}
          />
          <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
            Add Cover Art
          </Text>
        </View>
      )}
      
      {/* Overlay - shown on press/hover (web only) */}
      {Platform.OS === 'web' && (
        <View
          style={[
            styles.overlay,
            {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            },
          ]}
          onMouseEnter={(e) => {
            if (e.currentTarget) {
              (e.currentTarget as any).style.opacity = '1';
            }
          }}
          onMouseLeave={(e) => {
            if (e.currentTarget) {
              (e.currentTarget as any).style.opacity = '0';
            }
          }}
        >
          <MaterialCommunityIcons
            name="camera"
            size={24}
            color="#FFFFFF"
          />
          <Text style={styles.overlayText}>
            {value ? 'Change' : 'Add'} Cover Art
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  image: {
    borderRadius: 20,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    opacity: 0,
    borderRadius: 20,
    ...Platform.select({
      web: {
        transition: 'opacity 0.2s',
        cursor: 'pointer',
      },
    }),
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

