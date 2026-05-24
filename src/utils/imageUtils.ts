import ImageResizer from 'react-native-image-resizer';
import { supabase } from '../lib/supabase'; // Update with the correct import path for your Supabase client
import { Platform } from 'react-native';
import { showToast } from './alert';
import type { RouteImageAlignment } from '../model/routes.model';
import { getExploreTileHeight } from './exploreLayoutUtils';

export interface ResizedImage {
  uri: string;
  client_id: string;
  filename: string;
}

interface FileToUpload {
  file: string; // Local file URI
  path: string; // Path in the bucket
}

interface UploadMultipleFilesResponse {
  success: boolean;
  results: Array<{ path: string; success: boolean; error?: string }>;
}

/**
 * Galeri/kamera URI'lerini (Android content://, iOS file:// vb.) okur.
 * RNFS.readFile çoğu cihazda content:// ile güvenilir çalışmaz; yükleme için fetch kullanın.
 */
export async function readLocalImageUriAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error(`readLocalImageUriAsArrayBuffer: status ${response.status}`);
  }

  return response.arrayBuffer();
}

export function normalizeImageDimension(value: number | undefined | null): number | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.round(value);
}

export interface PostCarouselHeightOptions {
  minHeight?: number;
  maxHeight?: number;
  defaultHeight?: number;
}

/**
 * Feed gönderi carousel yüksekliği: DB piksel boyutu veya image_alignment yedek.
 */
export function getPostCarouselDisplayHeight(
  screenWidth: number,
  imageWidth: number | null | undefined,
  imageHeight: number | null | undefined,
  imageAlignment: RouteImageAlignment | null | undefined,
  options: PostCarouselHeightOptions = {},
): number {
  const minHeight = options.minHeight ?? 250;
  const maxHeight = options.maxHeight ?? 1080;
  const defaultHeight = options.defaultHeight ?? 400;

  const width = normalizeImageDimension(imageWidth);
  const height = normalizeImageDimension(imageHeight);

  if (width !== null && height !== null) {
    const aspectRatio = height / width;
    const adjustedHeight = screenWidth * aspectRatio;

    return Math.max(minHeight, Math.min(maxHeight, adjustedHeight));
  }

  if (imageAlignment) {
    const fromAlignment = getExploreTileHeight(imageAlignment, screenWidth);

    return Math.max(minHeight, Math.min(maxHeight, fromAlignment));
  }

  return defaultHeight;
}

/**
 * Piksel çözünürlüğünden değil, genişlik/yükseklik oranından sınıf üretir.
 * Kareye yakın oranlar için küçük bir tolerans kullanılır.
 */
export function classifyImageAlignment(
  width: number | undefined,
  height: number | undefined
): RouteImageAlignment {
  if (width === undefined || height === undefined) {
    return 'unknown';
  }

  if (width <= 0 || height <= 0 || !Number.isFinite(width) || !Number.isFinite(height)) {
    return 'unknown';
  }

  const ratio = width / height;
  const squareTolerance = 0.06;

  if (Math.abs(ratio - 1) <= squareTolerance) {
    return 'square';
  }

  if (ratio < 1) {
    return 'portrait';
  }

  return 'landscape';
}

export async function resizeImage(
  uri: string,
  width: number = 1080,
  height: number = 608,
  format: 'JPEG' | 'PNG' | 'WEBP' = 'JPEG',
  quality: number = 80,
  clientId?: string
): Promise<ResizedImage | null> {
  try {
    if (!uri) {
      console.error('No URI provided for image resize');
      return null;
    }

    // Ensure the URI is properly formatted
    const imageUri = Platform.OS === 'android' ? `file://${uri}` : uri;

    const resized = await ImageResizer.createResizedImage(
      imageUri,
      width,
      height,
      format,
      quality,
      0,
      undefined,
      false,
      {
        mode: 'contain',
        onlyScaleDown: true,
      },
    );
    console.log('🚀 ~ resized:', resized);

    if (!resized || !resized.uri) {
      console.error('Failed to resize image: No result from ImageResizer');
      return null;
    }

    const filename = `${clientId || 'unknown_client'}_${Date.now()}.${format.toLowerCase()}`;

    return {
      uri: resized.uri,
      client_id: clientId || '',
      filename,
    };
  } catch (error) {
    console.error('Error resizing image:', error);
    showToast('error', 'Resim boyutlandırılırken bir hata oluştu');
    return null;
  }
}

export async function uploadImage(
  uri: string,
  filename: string,
  bucket: string = 'default-bucket', // Define your default bucket
  contentType: string = 'image/jpeg'
): Promise<string | null> {
  try {
    console.log('Uploading image:', filename, uri, bucket, contentType);
    const { data, error } = await supabase.storage.from(bucket).upload(filename, uri, {
      contentType,
    });

    if (error) {
      console.error('Error uploading image:', error.message);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filename);
    return publicUrl;
  } catch (error) {
    console.error('Error during image upload:', error);
    return null;
  }
}

export async function resizeAndUploadImage(
  file: { uri: string; type: string },
  clientId: string,
  width: number = 1080,
  height: number = 608,
  format: 'JPEG' | 'PNG' | 'WEBP' = 'JPEG',
  quality: number = 80,
  bucket: string = 'default-bucket'
): Promise<string | null> {
  const resizedImage = await resizeImage(file.uri, width, height, format, quality, clientId);
  if (!resizedImage) {
    console.error('Failed to resize image');
    return null;
  }

  return await uploadImage(resizedImage.uri, resizedImage.filename, bucket, file.type);
}

export async function resizeMultipleImages(
  images: Array<{ uri: string; client_id: string }>,
  width: number = 1285,
  height: number = 1080,
  format: 'JPEG' | 'PNG' | 'WEBP' = 'JPEG',
  quality: number = 80
): Promise<Array<ResizedImage | null>> {
  const resizePromises = images.map(({ uri, client_id }) =>
    resizeImage(uri, width, height, format, quality, client_id)
  );

  return Promise.all(resizePromises);
}

export async function uploadMultipleFiles(
  files: FileToUpload[],
  bucketName: string
): Promise<UploadMultipleFilesResponse> {
  const uploadResults = [];

  for (const file of files) {
    try {
      const fileBlob = await fetch(file.file).then((res) => res.blob());
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(file.path, fileBlob);

      if (error) {
        uploadResults.push({ path: file.path, success: false, error: error.message });
      } else {
        uploadResults.push({ path: file.path, success: true });
      }
    } catch (error) {
      uploadResults.push({ path: file.path, success: false, error: String(error) });
    }
  }

  const allSuccessful = uploadResults.every((result) => result.success);

  return {
    success: allSuccessful,
    results: uploadResults,
  };
}
