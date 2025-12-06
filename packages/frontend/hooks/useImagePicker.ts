import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { useOxy } from '@oxyhq/services';
import { api } from '@/utils/api';

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
        mediaTypes: 'images',
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
        mediaTypes: 'images',
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
   * Upload image to backend and return image ID (MongoDB ObjectId string)
   * Always uploads images - no URL passthrough
   */
  const uploadImage = useCallback(async (imageResult: ImagePickerResult): Promise<string | undefined> => {
    try {
      setIsUploading(true);
      
      const formData = new FormData();
      const uri = imageResult.uri;

      if (Platform.OS === 'web') {
        // Web: Check if it's a blob URL
        if (uri.startsWith('blob:')) {
          // Fetch the blob and create a File object
          const response = await fetch(uri);
          const blob = await response.blob();
          const fileName = `image-${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`;
          formData.append('image', blob, fileName);
        } else {
          // Regular file path - fetch and upload
          const response = await fetch(uri);
          const blob = await response.blob();
          const fileName = `image-${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`;
          formData.append('image', blob, fileName);
        }
      } else {
        // React Native: Use the URI directly
        const fileName = uri.split('/').pop() || `image-${Date.now()}.jpg`;
        const fileType = imageResult.type || 'image/jpeg';
        formData.append('image', {
          uri: uri,
          name: fileName,
          type: fileType,
        } as any);
      }

      // Upload to backend
      // Use relative path to ensure axios interceptors properly add authentication headers
      // The api helper's baseURL already includes /api, so don't include it in the endpoint
      // Explicitly set Content-Type header to match the working pattern in artistService.uploadTrack()
      const response = await api.post<{ id: string }>(
        '/images/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Return the image ID (MongoDB ObjectId string)
      // api.post() returns { data: T }, so access response.data.id
      return response.data.id;
    } catch (error: any) {
      console.error('Image upload error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to upload image. Please try again.';
      Alert.alert('Error', errorMessage);
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

