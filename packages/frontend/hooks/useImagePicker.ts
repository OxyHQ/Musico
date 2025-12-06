import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { useOxy } from '@oxyhq/services';

export interface ImagePickerResult {
  uri: string;
  width?: number;
  height?: number;
  type?: string;
  base64?: string;
}

export interface UseImagePickerOptions {
  allowsEditing?: boolean;
  quality?: number;
  aspect?: [number, number];
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * Hook for picking images from device
 * Supports both library and camera selection
 */
export function useImagePicker(options: UseImagePickerOptions = {}) {
  const { oxyServices } = useOxy();
  const [isUploading, setIsUploading] = useState(false);
  const {
    allowsEditing = true,
    quality = 0.8,
    aspect = [1, 1], // Square aspect ratio for playlist covers
    maxWidth = 2000,
    maxHeight = 2000,
  } = options;

  const pickImage = useCallback(async (source: 'library' | 'camera' = 'library'): Promise<ImagePickerResult | null> => {
    try {
      // Request permissions
      if (source === 'camera') {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (!cameraPermission.granted) {
          Alert.alert('Permission Required', 'Camera permission is required to take photos.');
          return null;
        }
      } else {
        const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!mediaLibraryPermission.granted) {
          Alert.alert('Permission Required', 'Media library permission is required to select images.');
          return null;
        }
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing,
        aspect,
        quality,
        allowsMultipleSelection: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.type,
        base64: asset.base64 || undefined,
      };
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      return null;
    }
  }, [allowsEditing, aspect, quality]);

  const takePhoto = useCallback(async (): Promise<ImagePickerResult | null> => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermission.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing,
        aspect,
        quality,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.type,
        base64: asset.base64 || undefined,
      };
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      return null;
    }
  }, [allowsEditing, aspect, quality]);

  /**
   * Upload image to backend and return URL
   * For now, returns data URL if upload not available
   */
  const uploadImage = useCallback(async (imageResult: ImagePickerResult): Promise<string | undefined> => {
    try {
      setIsUploading(true);
      
      // Try to upload via Oxy services if available
      // For now, we'll use the local URI as a data URL or pass it directly
      // In a real implementation, you'd upload to S3/GridFS and get a URL
      
      // For now, return the local URI (will work for preview, but not for production)
      // TODO: Implement actual image upload endpoint
      return imageResult.uri || undefined;
    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
      return undefined;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return {
    pickImage,
    takePhoto,
    uploadImage,
    isUploading,
  };
}

