import { useState, useEffect } from 'react';
import { ImageService } from '../services/ImageService';

interface ImageDownloadState {
  imageUri: string | null;
  loading: boolean;
  error: string | null;
  retryCount: number;
}

// Generic image download hook
export const useImageDownload = (
  imageUrl: string | undefined,
  bucketName: string,
  userId: string
) => {
  const [state, setState] = useState<ImageDownloadState>({
    imageUri: null,
    loading: false,
    error: null,
    retryCount: 0,
  });

  useEffect(() => {
    if (!imageUrl || !userId) {
      setState({
        imageUri: null,
        loading: false,
        error: null,
        retryCount: 0,
      });
      return;
    }

    const downloadImage = async () => {
      const result = await ImageService.downloadImage(
        imageUrl,
        bucketName,
        userId,
        (downloadState) => {
          setState({
            imageUri: downloadState.imageUri,
            loading: downloadState.loading,
            error: downloadState.error,
            retryCount: downloadState.retryCount,
          });
        }
      );
    };

    downloadImage();
  }, [imageUrl, bucketName, userId]);

  return state;
};

// Post image download hook
export const usePostImageDownload = (
  imageUrl: string | undefined,
  userId: string
) => {
  const [state, setState] = useState<ImageDownloadState>({
    imageUri: null,
    loading: false,
    error: null,
    retryCount: 0,
  });

  useEffect(() => {
    if (!imageUrl || !userId) {
      setState({
        imageUri: null,
        loading: false,
        error: null,
        retryCount: 0,
      });
      return;
    }

    const downloadImage = async () => {
      const result = await ImageService.downloadPostImage(
        imageUrl,
        userId,
        (downloadState) => {
          setState({
            imageUri: downloadState.imageUri,
            loading: downloadState.loading,
            error: downloadState.error,
            retryCount: downloadState.retryCount,
          });
        }
      );
    };

    downloadImage();
  }, [imageUrl, userId]);

  return state;
};

// Profile image download hook (prefers preview path when provided)
export const useProfileImageDownload = (
  imageUrl: string | undefined,
  userId: string,
  imagePreviewUrl?: string | undefined
) => {
  const [state, setState] = useState<ImageDownloadState>({
    imageUri: null,
    loading: false,
    error: null,
    retryCount: 0,
  });

  useEffect(() => {
    const storageKey = imagePreviewUrl || imageUrl;

    if (!storageKey || !userId) {
      setState({
        imageUri: null,
        loading: false,
        error: null,
        retryCount: 0,
      });
      return;
    }

    const downloadImage = async () => {
      await ImageService.downloadProfileImage(
        storageKey,
        userId,
        (downloadState) => {
          setState({
            imageUri: downloadState.imageUri,
            loading: downloadState.loading,
            error: downloadState.error,
            retryCount: downloadState.retryCount,
          });
        }
      );
    };

    downloadImage();
  }, [imageUrl, imagePreviewUrl, userId]);

  return state;
};

// Profile background image download hook (prefers preview path when provided)
export const useProfileBackgroundDownload = (
  imageUrl: string | undefined,
  userId: string,
  imagePreviewUrl?: string | undefined
) => {
  const [state, setState] = useState<ImageDownloadState>({
    imageUri: null,
    loading: false,
    error: null,
    retryCount: 0,
  });

  useEffect(() => {
    const storageKey = imagePreviewUrl || imageUrl;

    if (!storageKey || !userId) {
      setState({
        imageUri: null,
        loading: false,
        error: null,
        retryCount: 0,
      });
      return;
    }

    const downloadImage = async () => {
      await ImageService.downloadProfileBackground(
        storageKey,
        userId,
        (downloadState) => {
          setState({
            imageUri: downloadState.imageUri,
            loading: downloadState.loading,
            error: downloadState.error,
            retryCount: downloadState.retryCount,
          });
        }
      );
    };

    downloadImage();
  }, [imageUrl, imagePreviewUrl, userId]);

  return state;
};
