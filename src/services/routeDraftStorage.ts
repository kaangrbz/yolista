import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { encode } from 'base64-arraybuffer';
import { readLocalImageUriAsArrayBuffer } from '../utils/imageUtils';
import type { Photo } from '../screens/CreateRoute/PhotoSelectionScreen';
import type { RoutePublishDraftRecord } from './routePublishTypes';

const STORAGE_KEY = 'route_publish_draft_v1';
const DRAFT_ROOT = `${RNFS.DocumentDirectoryPath}/route_publish_drafts`;

async function ensureDraftRoot(): Promise<void> {
  const exists = await RNFS.exists(DRAFT_ROOT);

  if (!exists) {
    await RNFS.mkdir(DRAFT_ROOT);
  }
}

function localPathToFileUri(path: string): string {
  if (path.startsWith('file://')) {
    return path;
  }

  return `file://${path}`;
}

/**
 * Copies each photo into the job folder and returns paths + updated Photo metadata.
 */
export async function copyPhotosToDraftDirectory(
  jobId: string,
  photos: Photo[],
): Promise<{ localPaths: string[]; photosWithLocalUris: Photo[] }> {
  await ensureDraftRoot();
  const jobDir = `${DRAFT_ROOT}/${jobId}`;
  const jobDirExists = await RNFS.exists(jobDir);

  if (!jobDirExists) {
    await RNFS.mkdir(jobDir);
  }

  const localPaths: string[] = [];
  const photosWithLocalUris: Photo[] = [];

  for (let index = 0; index < photos.length; index++) {
    const photo = photos[index];
    const destPath = `${jobDir}/photo_${index}.jpg`;
    const sourceUri = photo.processedLocalUri || photo.uri;

    if (photo.processedLocalUri) {
      const sourcePath = photo.processedLocalUri.replace(/^file:\/\//, '');
      const destExists = await RNFS.exists(destPath);

      if (destExists) {
        await RNFS.unlink(destPath);
      }

      await RNFS.copyFile(sourcePath, destPath);
    } else {
      const buffer = await readLocalImageUriAsArrayBuffer(sourceUri);
      await RNFS.writeFile(destPath, encode(buffer), 'base64');
    }

    localPaths.push(destPath);
    photosWithLocalUris.push({
      ...photo,
      uri: localPathToFileUri(destPath),
      processedLocalUri: localPathToFileUri(destPath),
    });
  }

  return { localPaths, photosWithLocalUris };
}

export async function saveDraftRecord(record: RoutePublishDraftRecord): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

export async function loadDraftRecord(): Promise<RoutePublishDraftRecord | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as RoutePublishDraftRecord;
  } catch {
    return null;
  }
}

export async function clearDraftStorage(jobId: string): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
  const jobDir = `${DRAFT_ROOT}/${jobId}`;
  const exists = await RNFS.exists(jobDir);

  if (exists) {
    const files = await RNFS.readDir(jobDir);

    for (const file of files) {
      await RNFS.unlink(file.path);
    }

    await RNFS.unlink(jobDir);
  }
}

export async function markDraftFailed(
  record: RoutePublishDraftRecord,
  reason: string,
): Promise<void> {
  const next: RoutePublishDraftRecord = {
    ...record,
    status: 'failed',
    failedReason: reason,
  };

  await saveDraftRecord(next);
}
