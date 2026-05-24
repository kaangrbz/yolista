import { supabase } from '../lib/supabase';
import { randomString } from '../utils/randomString';
import { readLocalImageUriAsArrayBuffer } from '../utils/imageUtils';

export async function uploadRoutePhotoToStorage(
  userId: string,
  localUri: string,
): Promise<{ fileName: string }> {
  const body = await readLocalImageUriAsArrayBuffer(localUri);
  const fileName = `${randomString(16)}.jpg`;
  const filePath = `${userId}/${fileName}`;
  const { data, error } = await supabase.storage
    .from('routes')
    .upload(filePath, body, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'image/jpeg',
    });

  if (error || !data) {
    throw new Error(error?.message || 'Yükleme başarısız');
  }

  return { fileName };
}
