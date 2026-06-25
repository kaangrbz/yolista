import RNFS from 'react-native-fs';
import { supabase } from '../lib/supabase';
import { resizeImage, resizeImageCover } from '../utils/imageUtils';
import type { CreateFlowPhoto } from '../types/createRouteFlowTypes';
import { uploadRoutePhotoWithVariants } from './routePhotoStorage';
import { getRouteImagePolicy } from './routeImagePolicy';

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

  const policy = await getRouteImagePolicy();
  const destPath = `${jobDir}/${photoId}.jpg`;
  const resized = await resizeImage(
    sourceUri,
    policy.full_max_px,
    policy.full_max_px,
    'JPEG',
    policy.jpeg_quality,
    photoId,
  );

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

export async function prepareRoutePhotoThumb(
  jobId: string,
  photoId: string,
  sourceUri: string,
): Promise<string> {
  return prepareRoutePhotoVariant(jobId, photoId, sourceUri, 'thumb');
}

export async function prepareRoutePhotoMedium(
  jobId: string,
  photoId: string,
  sourceUri: string,
): Promise<string> {
  return prepareRoutePhotoVariant(jobId, photoId, sourceUri, 'medium');
}

/** @deprecated prepareRoutePhotoThumb kullanın */
export async function prepareRoutePhotoPreview(
  jobId: string,
  photoId: string,
  sourceUri: string,
): Promise<string> {
  return prepareRoutePhotoThumb(jobId, photoId, sourceUri);
}

async function prepareRoutePhotoVariant(
  jobId: string,
  photoId: string,
  sourceUri: string,
  variant: 'thumb' | 'medium',
): Promise<string> {
  await ensureCreateDraftRoot();
  const jobDir = `${CREATE_DRAFT_ROOT}/${jobId}`;
  const jobDirExists = await RNFS.exists(jobDir);

  if (!jobDirExists) {
    await RNFS.mkdir(jobDir);
  }

  const policy = await getRouteImagePolicy();
  const size = variant === 'thumb' ? policy.thumb_size_px : policy.medium_size_px;
  const destPath = `${jobDir}/${photoId}_${variant}.jpg`;
  const cropped = await resizeImageCover(
    sourceUri,
    size,
    'JPEG',
    policy.jpeg_quality,
    photoId,
  );

  if (!cropped?.uri) {
    throw new Error('Fotoğraf varyantı oluşturulamadı');
  }

  const croppedPath = cropped.uri.replace(/^file:\/\//, '');
  const destExists = await RNFS.exists(destPath);

  if (destExists) {
    await RNFS.unlink(destPath);
  }

  await RNFS.copyFile(croppedPath, destPath);

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
    const thumbUri = await prepareRoutePhotoThumb(jobId, photo.id, photo.uri);
    const mediumUri = await prepareRoutePhotoMedium(jobId, photo.id, photo.uri);

    onPatch({
      id: photo.id,
      uploadStatus: 'uploading',
      processedLocalUri: processedUri,
    });

    const { fileName, thumbFileName, mediumFileName } = await uploadRoutePhotoWithVariants(
      userId,
      processedUri,
      thumbUri,
      mediumUri,
    );

    onPatch({
      id: photo.id,
      uploadStatus: 'done',
      storageFileName: fileName,
      storageThumbFileName: thumbFileName,
      storageMediumFileName: mediumFileName,
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
