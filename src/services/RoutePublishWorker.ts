import RouteModel, { RoutePoint } from '../model/routes.model';
import { randomString } from '../utils/randomString';
import { classifyImageAlignment, normalizeImageDimension } from '../utils/imageUtils';
import {
  clearDraftStorage,
  copyPhotosToDraftDirectory,
  markDraftFailed,
  saveDraftRecord,
} from './routeDraftStorage';
import { clearWizardDraft } from './routeWizardDraftStorage';
import type { RoutePublishDraftRecord, RoutePublishEnqueuePayload } from './routePublishTypes';
import { uploadRoutePhotoToStorage } from './routePhotoStorage';

function getPublishStoreState() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  return require('../store/routePublishStore').useRoutePublishStore.getState();
}

const TOTAL_STEPS_FOR_PROGRESS = (imageCount: number) => imageCount + 1;

function computeProgress01(completedSteps: number, totalSteps: number): number {
  if (totalSteps <= 0) {
    return 0;
  }

  return Math.min(1, completedSteps / totalSteps);
}

export async function beginRoutePublishFromEnqueue(
  payload: RoutePublishEnqueuePayload,
  userId: string,
): Promise<void> {
  let record: RoutePublishDraftRecord | null = null;

  try {
    const jobId = randomString(16);
    const { localPaths, photosWithLocalUris } = await copyPhotosToDraftDirectory(
      jobId,
      payload.selectedPhotos,
    );

    record = {
      jobId,
      version: 1,
      status: 'pending',
      localPhotoPaths: localPaths,
      photosMeta: photosWithLocalUris,
      routeStops: payload.routeStops,
      selectedCategory: payload.selectedCategory,
      selectedCity: payload.selectedCity,
      userId,
    };

    await saveDraftRecord(record);
    await executeRoutePublish(record);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Rota oluşturulamadı';

    if (record) {
      await markDraftFailed(record, message);
    }

    getPublishStoreState().workerFailed({
      lastError: message,
      draftSaved: !!record,
    });
  }
}

export async function executeRoutePublish(record: RoutePublishDraftRecord): Promise<void> {
  const store = getPublishStoreState();
  const totalSteps = TOTAL_STEPS_FOR_PROGRESS(record.photosMeta.length);
  let completedSteps = 0;

  try {
    if (record.routeStops.length !== record.photosMeta.length) {
      throw new Error('Durak ve fotoğraf sayısı eşleşmiyor');
    }

    const routePoints: RoutePoint[] = record.routeStops.map((stop, index) => {
      const photo = record.photosMeta[index];
      const alignment = classifyImageAlignment(photo?.width, photo?.height);

      return {
        client_id: randomString(16),
        title: stop.title,
        description: stop.description || '',
        image_url: photo?.storageFileName || photo?.uri || '',
        image_alignment: alignment,
        image_width: normalizeImageDimension(photo?.width),
        image_height: normalizeImageDimension(photo?.height),
        order_index: index,
        is_deleted: false,
        city_id: record.selectedCity?.id || null,
        user_id: record.userId,
      };
    });

    const uploadedFileNames: string[] = [];

    for (let index = 0; index < record.photosMeta.length; index++) {
      const photo = record.photosMeta[index];
      const routePoint = routePoints[index];

      if (!photo.uri && !photo.processedLocalUri) {
        throw new Error('Geçersiz fotoğraf');
      }

      if (!routePoint) {
        throw new Error('Geçersiz rota noktası');
      }

      const previewUri = photo.processedLocalUri || photo.uri;

      store.workerUploadTick({
        jobId: record.jobId,
        currentImageIndex: index,
        totalImages: record.photosMeta.length,
        previewUri,
        subtitleLine: `Fotoğraf ${index + 1} / ${record.photosMeta.length} yükleniyor`,
        progress01: computeProgress01(completedSteps, totalSteps),
      });

      if (photo.uploadStatus === 'done' && photo.storageFileName) {
        uploadedFileNames[index] = photo.storageFileName;
        completedSteps += 1;

        store.workerUploadTick({
          jobId: record.jobId,
          currentImageIndex: index,
          totalImages: record.photosMeta.length,
          previewUri,
          subtitleLine: `Fotoğraf ${index + 1} / ${record.photosMeta.length} yüklendi`,
          progress01: computeProgress01(completedSteps, totalSteps),
        });

        continue;
      }

      const uploadUri = photo.processedLocalUri || photo.uri;
      const { fileName } = await uploadRoutePhotoToStorage(record.userId, uploadUri);
      uploadedFileNames[index] = fileName;
      completedSteps += 1;

      store.workerUploadTick({
        jobId: record.jobId,
        currentImageIndex: index,
        totalImages: record.photosMeta.length,
        previewUri,
        subtitleLine: `Fotoğraf ${index + 1} / ${record.photosMeta.length} yüklendi`,
        progress01: computeProgress01(completedSteps, totalSteps),
      });
    }

    const finalRoutePoints = routePoints.map((point, index) => {
      const uploadedFileName = uploadedFileNames[index];

      if (!uploadedFileName) {
        throw new Error('Tüm görseller doğrulanamadı');
      }

      return {
        ...point,
        image_url: uploadedFileName,
      };
    });

    store.workerCreating({
      previewUri: record.photosMeta[0]?.processedLocalUri || record.photosMeta[0]?.uri || null,
      subtitleLine: 'Gönderi kaydediliyor',
      progress01: computeProgress01(completedSteps, totalSteps),
    });

    const { error } = await RouteModel.createRoute(
      finalRoutePoints,
      record.selectedCity?.id || 0,
      record.selectedCategory?.id || null,
    );

    if (error) {
      throw new Error('Rota kaydedilemedi');
    }

    completedSteps += 1;
    await clearDraftStorage(record.jobId);
    await clearWizardDraft(record.jobId);

    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    require('../store/createRouteFlowStore').useCreateRouteFlowStore.getState().completeFlow();

    store.workerSuccess({ progress01: 1 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
    await markDraftFailed(record, message);
    store.workerFailed({ lastError: message, draftSaved: true });
  }
}
