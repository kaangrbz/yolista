import { supabase } from '../lib/supabase';
import { randomString } from '../utils/randomString';
import { readLocalImageUriAsArrayBuffer } from '../utils/imageUtils';

export interface RoutePhotoUploadResult {
  fileName: string;
  previewFileName: string;
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

export async function uploadRoutePhotoWithPreview(
  userId: string,
  fullLocalUri: string,
  previewLocalUri: string,
): Promise<RoutePhotoUploadResult> {
  const fileName = `${randomString(16)}.jpg`;
  const previewFileName = `preview/${randomString(16)}.jpg`;

  const fullBody = await readLocalImageUriAsArrayBuffer(fullLocalUri);
  await uploadBytesToRoutesBucket(userId, fileName, fullBody);

  try {
    const previewBody = await readLocalImageUriAsArrayBuffer(previewLocalUri);
    await uploadBytesToRoutesBucket(userId, previewFileName, previewBody);
  } catch (previewError) {
    await supabase.storage.from('routes').remove([`${userId}/${fileName}`]);

    throw previewError instanceof Error
      ? previewError
      : new Error('Önizleme yüklenemedi');
  }

  return { fileName, previewFileName };
}

/** @deprecated Tek dosya yüklemesi — yeni akış uploadRoutePhotoWithPreview kullanır. */
export async function uploadRoutePhotoToStorage(
  userId: string,
  localUri: string,
): Promise<{ fileName: string }> {
  const body = await readLocalImageUriAsArrayBuffer(localUri);
  const fileName = `${randomString(16)}.jpg`;
  await uploadBytesToRoutesBucket(userId, fileName, body);

  return { fileName };
}
