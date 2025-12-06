import { useState, useEffect, useCallback, useRef } from 'react';
import { createBlobUrl, revokeBlobUrl, isBlobUrl } from '@/utils/blob';

/**
 * Hook to manage blob URL lifecycle with automatic cleanup
 * Works on both web and native platforms using expo-blob
 * 
 * Automatically revokes blob URLs when:
 * - Component unmounts
 * - New file/blob is set
 * - Explicitly cleared
 * 
 * @example
 * ```tsx
 * const { blobUrl, setFile, clear } = useBlobUrl();
 * 
 * // Set a file (creates blob URL on web, uses original URI on native)
 * setFile(file, fileUri);
 * 
 * // Clear and revoke
 * clear();
 * ```
 */
export function useBlobUrl() {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);

  // Cleanup function
  const cleanup = useCallback((url: string | null) => {
    if (url && isBlobUrl(url)) {
      revokeBlobUrl(url);
    }
  }, []);

  // Set file/blob and create blob URL
  const setFile = useCallback(
    (fileOrBlob: File | Blob | null, originalUri?: string) => {
      // Revoke previous blob URL
      if (currentBlobUrlRef.current) {
        cleanup(currentBlobUrlRef.current);
        currentBlobUrlRef.current = null;
      }

      if (!fileOrBlob) {
        setBlobUrl(null);
        return;
      }

      // createBlobUrl handles platform detection internally
      const url = createBlobUrl(fileOrBlob, originalUri);
      if (isBlobUrl(url)) {
        currentBlobUrlRef.current = url;
      }
      setBlobUrl(url);
    },
    [cleanup]
  );

  // Clear blob URL
  const clear = useCallback(() => {
    if (currentBlobUrlRef.current) {
      cleanup(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
    setBlobUrl(null);
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentBlobUrlRef.current) {
        cleanup(currentBlobUrlRef.current);
      }
    };
  }, [cleanup]);

  return {
    blobUrl,
    setFile,
    clear,
  };
}

/**
 * Hook to create a blob URL from a File object (simpler API for single file)
 * 
 * @example
 * ```tsx
 * const { url, setFile, clear } = useFileBlobUrl();
 * 
 * // When file input changes
 * const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 *   const file = e.target.files?.[0];
 *   if (file) {
 *     setFile(file);
 *   }
 * };
 * ```
 */
export function useFileBlobUrl() {
  const { blobUrl, setFile, clear } = useBlobUrl();

  const handleFile = useCallback(
    (file: File | null, originalUri?: string) => {
      setFile(file, originalUri);
    },
    [setFile]
  );

  return {
    url: blobUrl,
    setFile: handleFile,
    clear,
  };
}

