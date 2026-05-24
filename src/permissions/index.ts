import { requestLocationPermission } from './location';
import {
  checkPermission as checkPermissionInternal,
  requestPermission as requestPermissionInternal,
} from './permissionService';
import { PermissionKind, PermissionResult } from './types';

export type { PermissionKind, PermissionResult } from './types';

export const checkPermission = async (
  kind: PermissionKind,
): Promise<PermissionResult> => {
  if (kind === 'location') {
    // Konum için ayrı akış var; check API'sini de tek bir granted/denied'a indir.
    return requestLocationPermission();
  }

  return checkPermissionInternal(kind);
};

export const requestPermission = async (
  kind: PermissionKind,
): Promise<PermissionResult> => {
  if (kind === 'location') {
    return requestLocationPermission();
  }

  return requestPermissionInternal(kind);
};

const toBoolean = (result: PermissionResult): boolean => {
  return result === 'granted';
};

export const requestLocation = async (): Promise<boolean> => {
  const result = await requestPermission('location');

  return toBoolean(result);
};

export const requestCamera = async (): Promise<boolean> => {
  const result = await requestPermission('camera');

  return toBoolean(result);
};

export const requestPhotos = async (): Promise<boolean> => {
  const result = await requestPermission('photos');

  return toBoolean(result);
};

export const requestMediaLibrary = async (): Promise<boolean> => {
  const result = await requestPermission('mediaLibrary');

  return toBoolean(result);
};
