import { Platform } from 'react-native';
import { PERMISSIONS, Permission } from 'react-native-permissions';
import { PermissionKind } from './types';

const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';
const isAndroid13OrHigher = isAndroid && Number(Platform.Version) >= 33;

/**
 * Tek bir PermissionKind, platform/SDK seviyesine göre birden fazla
 * native izne karşılık gelebilir (örn. Android 13+ için fotoğraflar).
 *
 * Konum izni FINE+COARSE çift declare özel akışı location.ts içinde,
 * burada listelenmez.
 */
export const getNativePermissions = (kind: PermissionKind): Permission[] => {
  if (kind === 'camera') {
    if (isIOS) {
      return [PERMISSIONS.IOS.CAMERA];
    }

    return [PERMISSIONS.ANDROID.CAMERA];
  }

  if (kind === 'photos' || kind === 'mediaLibrary') {
    if (isIOS) {
      if (kind === 'mediaLibrary') {
        return [PERMISSIONS.IOS.MEDIA_LIBRARY];
      }

      return [PERMISSIONS.IOS.PHOTO_LIBRARY];
    }

    if (isAndroid13OrHigher) {
      return [
        PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
        PERMISSIONS.ANDROID.READ_MEDIA_VIDEO,
      ];
    }

    return [PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE];
  }

  return [];
};
