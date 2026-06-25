import { supabase } from '../lib/supabase';
import { randomString } from '../utils/randomString';
import { readLocalImageUriAsArrayBuffer } from '../utils/imageUtils';

export interface RoutePhotoUploadResult {
  fileName: string;
  thumbFileName: string;
  mediumFileName: string;
}

async function uploadBytesToRoutesBucket(
  userId: string,
  relativePath: string,
  body: ArrayBuffer,
): Promise<void> {
  const { error } = await supabase.storage.from('routes').upload(`${userId}/${relativePath}`, body, {
    cacheControl: '3600',
    upsert: false,
    contentType: 'image/jpeg',
  });

  if (error) {
    throw new Error(error.message || 'Yükleme başarısız');
  }
}

async function removeUploadedPaths(userId: string, paths: string[]): Promise<void> {
  if (paths.length === 0) {
    return;
  }

  await supabase.storage.from('routes').remove(paths.map((path) => `${userId}/${path}`));
}

export async function uploadRoutePhotoWithVariants(
  userId: string,
  fullLocalUri: string,
  thumbLocalUri: string,
  mediumLocalUri: string,
): Promise<RoutePhotoUploadResult> {
  const fileName = `${randomString(16)}.jpg`;
  const thumbFileName = `thumb/${randomString(16)}.jpg`;
  const mediumFileName = `medium/${randomString(16)}.jpg`;

  const uploadedPaths: string[] = [];

  try {
    const fullBody = await readLocalImageUriAsArrayBuffer(fullLocalUri);
    await uploadBytesToRoutesBucket(userId, fileName, fullBody);
    uploadedPaths.push(fileName);

    const thumbBody = await readLocalImageUriAsArrayBuffer(thumbLocalUri);
    await uploadBytesToRoutesBucket(userId, thumbFileName, thumbBody);
    uploadedPaths.push(thumbFileName);

    const mediumBody = await readLocalImageUriAsArrayBuffer(mediumLocalUri);
    await uploadBytesToRoutesBucket(userId, mediumFileName, mediumBody);
    uploadedPaths.push(mediumFileName);

    return { fileName, thumbFileName, mediumFileName };
  } catch (error) {
    await removeUploadedPaths(userId, uploadedPaths);

    throw error instanceof Error ? error : new Error('Görsel yüklenemedi');
  }
}

/** @deprecated uploadRoutePhotoWithVariants kullanın */
export async function uploadRoutePhotoWithPreview(
  userId: string,
  fullLocalUri: string,
  previewLocalUri: string,
): Promise<{ fileName: string; previewFileName: string }> {
  const result = await uploadRoutePhotoWithVariants(
    userId,
    fullLocalUri,
    previewLocalUri,
    previewLocalUri,
  );

  return {
    fileName: result.fileName,
    previewFileName: result.thumbFileName,
  };
}

/** @deprecated Tek dosya yüklemesi — yeni akış uploadRoutePhotoWithVariants kullanır. */
export async function uploadRoutePhotoToStorage(
  userId: string,
  localUri: string,
): Promise<{ fileName: string }> {
  const body = await readLocalImageUriAsArrayBuffer(localUri);
  const fileName = `${randomString(16)}.jpg`;
  await uploadBytesToRoutesBucket(userId, fileName, body);

  return { fileName };
}
