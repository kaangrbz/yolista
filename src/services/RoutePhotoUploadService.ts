import RNFS from 'react-native-fs';
import { supabase } from '../lib/supabase';
import { resizeImage } from '../utils/imageUtils';
import type { CreateFlowPhoto } from '../types/createRouteFlowTypes';
import { uploadRoutePhotoToStorage } from './routePhotoStorage';

const CREATE_DRAFT_ROOT = `${RNFS.DocumentDirectoryPath}/route_create_drafts`;
const MAX_CONCURRENT_UPLOADS = 2;

const activeQueues = new Map<string, Promise<void>>();

function localPathToFileUri(path: string): string {
  if (path.startsWith('file://')) {
    return path;
  }

  return `file://${path}`;
}

async function ensureCreateDraftRoot(): Promise<void> {
  const exists = await RNFS.exists(CREATE_DRAFT_ROOT);

  if (!exists) {
    await RNFS.mkdir(CREATE_DRAFT_ROOT);
  }
}

export async function prepareRoutePhotoLocal(
  jobId: string,
  photoId: string,
  sourceUri: string,
): Promise<string> {
  await ensureCreateDraftRoot();
  const jobDir = `${CREATE_DRAFT_ROOT}/${jobId}`;
  const jobDirExists = await RNFS.exists(jobDir);

  if (!jobDirExists) {
    await RNFS.mkdir(jobDir);
  }

  const destPath = `${jobDir}/${photoId}.jpg`;
  const resized = await resizeImage(sourceUri, 1920, 1920, 'JPEG', 80, photoId);

  if (!resized?.uri) {
    throw new Error('Fotoğraf işlenemedi');
  }

  const resizedPath = resized.uri.replace(/^file:\/\//, '');
  const destExists = await RNFS.exists(destPath);

  if (destExists) {
    await RNFS.unlink(destPath);
  }

  await RNFS.copyFile(resizedPath, destPath);

  return localPathToFileUri(destPath);
}

type PhotoPatch = Partial<CreateFlowPhoto> & { id: string };

async function runUploadPipeline(
  jobId: string,
  userId: string,
  photo: CreateFlowPhoto,
  onPatch: (patch: PhotoPatch) => void,
): Promise<void> {
  onPatch({ id: photo.id, uploadStatus: 'processing', uploadError: undefined });

  try {
    const processedUri = await prepareRoutePhotoLocal(jobId, photo.id, photo.uri);

    onPatch({
      id: photo.id,
      uploadStatus: 'uploading',
      processedLocalUri: processedUri,
    });

    const { fileName } = await uploadRoutePhotoToStorage(userId, processedUri);

    onPatch({
      id: photo.id,
      uploadStatus: 'done',
      storageFileName: fileName,
      uploadError: undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Yükleme başarısız';

    onPatch({
      id: photo.id,
      uploadStatus: 'failed',
      uploadError: message,
    });
  }
}

async function processQueue(
  jobId: string,
  userId: string,
  photos: CreateFlowPhoto[],
  onPatch: (patch: PhotoPatch) => void,
): Promise<void> {
  const pending = photos.filter(
    (photo) =>
      photo.uploadStatus === 'pending' ||
      photo.uploadStatus === 'failed',
  );

  let index = 0;

  const runWorker = async (): Promise<void> => {
    while (index < pending.length) {
      const currentIndex = index;
      index += 1;
      const photo = pending[currentIndex];

      if (!photo) {
        return;
      }

      await runUploadPipeline(jobId, userId, photo, onPatch);
    }
  };

  const workerCount = Math.min(MAX_CONCURRENT_UPLOADS, pending.length);
  const workers: Promise<void>[] = [];

  for (let workerIndex = 0; workerIndex < workerCount; workerIndex++) {
    workers.push(runWorker());
  }

  await Promise.all(workers);
}

export function enqueuePhotoUploads(
  jobId: string,
  photos: CreateFlowPhoto[],
  onPatch: (patch: PhotoPatch) => void,
): void {
  const queueKey = jobId;

  const previous = activeQueues.get(queueKey) ?? Promise.resolve();

  const next = previous
    .then(async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      await processQueue(jobId, user.id, photos, onPatch);
    })
    .catch(() => {
      // Individual photo errors are patched per photo
    });

  activeQueues.set(queueKey, next);
}

export async function retryPhotoUpload(
  jobId: string,
  photo: CreateFlowPhoto,
  onPatch: (patch: PhotoPatch) => void,
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const retryPhoto: CreateFlowPhoto = {
    ...photo,
    uploadStatus: 'pending',
    uploadError: undefined,
  };

  await processQueue(jobId, user.id, [retryPhoto], onPatch);
}
