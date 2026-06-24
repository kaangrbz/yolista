import { Platform } from 'react-native';
import * as FileSystem from 'react-native-fs';
import { requestPhotos } from '../permissions';
import { showToast } from './alert';

function isLocalImageUri(imageUri: string): boolean {
  return (
    imageUri.startsWith('file://') ||
    imageUri.startsWith('/') ||
    imageUri.startsWith('content://')
  );
}

function normalizeLocalPath(imageUri: string): string {
  if (imageUri.startsWith('file://')) {
    return imageUri.replace('file://', '');
  }

  return imageUri;
}

export async function saveImageToGallery(imageUri: string): Promise<boolean> {
  try {
    const hasPermission = await requestPhotos();

    if (!hasPermission) {
      showToast('error', 'Dosya erişim izni reddedildi');
      return false;
    }

    const timestamp = Date.now();
    const fileName = `yolista_${timestamp}.jpg`;
    const destinationPath = Platform.select({
      ios: `${FileSystem.DocumentDirectoryPath}/${fileName}`,
      android: `${FileSystem.PicturesDirectoryPath}/${fileName}`,
    });

    if (!destinationPath) {
      throw new Error('Could not determine save location');
    }

    if (isLocalImageUri(imageUri)) {
      await FileSystem.copyFile(normalizeLocalPath(imageUri), destinationPath);
    } else {
      const result = await FileSystem.downloadFile({
        fromUrl: imageUri,
        toFile: destinationPath,
      }).promise;

      if (result.statusCode && result.statusCode >= 400) {
        throw new Error(`Download failed with status ${result.statusCode}`);
      }
    }

    showToast('success', 'Fotoğraf başarıyla kaydedildi');
    return true;
  } catch (error) {
    console.error('Save image error:', error);
    showToast('error', 'Fotoğraf kaydedilirken bir hata oluştu');
    return false;
  }
}
