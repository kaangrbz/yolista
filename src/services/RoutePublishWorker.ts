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
import {
  prepareRoutePhotoPreview,
} from './RoutePhotoUploadService';
import { uploadRoutePhotoWithPreview } from './routePhotoStorage';
import { triggerAchievementChecks } from '../lib/achievements';

function getPublishStoreState() {

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
      const coordinate = stop.coordinate;
      const locationLabel = stop.address?.trim();

      return {
        client_id: randomString(16),
        title: stop.title.trim(),
        description: stop.description?.trim() || '',
        image_url: photo?.storageFileName || photo?.uri || '',
        image_alignment: alignment,
        image_width: normalizeImageDimension(photo?.width),
        image_height: normalizeImageDimension(photo?.height),
        order_index: index,
        is_deleted: false,
        city_id: record.selectedCity?.id || null,
        user_id: record.userId,
        ...(coordinate
          ? {
              latitude: coordinate.latitude,
              longitude: coordinate.longitude,
            }
          : {}),
        ...(locationLabel ? { location_label: locationLabel } : {}),
      };
    });

    const uploadedFileNames: string[] = [];
    const uploadedPreviewFileNames: string[] = [];

    for (let index = 0; index < record.photosMeta.length; index++) {
      const photo = record.photosMeta[index];
      const routePoint = routePoints[index];

      if (!photo.uri && !photo.processedLocalUri) {
        throw new Error('Geçersiz fotoğraf');
      }

      if (!routePoint) {
        throw new Error('Geçersiz rota noktası');
      }

      const tickPreviewUri = photo.processedLocalUri || photo.uri;

      store.workerUploadTick({
        jobId: record.jobId,
        currentImageIndex: index,
        totalImages: record.photosMeta.length,
        previewUri: tickPreviewUri,
        subtitleLine: `Fotoğraf ${index + 1} / ${record.photosMeta.length} yükleniyor`,
        progress01: computeProgress01(completedSteps, totalSteps),
      });

      if (photo.uploadStatus === 'done' && photo.storageFileName) {
        uploadedFileNames[index] = photo.storageFileName;
        uploadedPreviewFileNames[index] = photo.storagePreviewFileName || '';
        completedSteps += 1;

        store.workerUploadTick({
          jobId: record.jobId,
          currentImageIndex: index,
          totalImages: record.photosMeta.length,
          previewUri: tickPreviewUri,
          subtitleLine: `Fotoğraf ${index + 1} / ${record.photosMeta.length} yüklendi`,
          progress01: computeProgress01(completedSteps, totalSteps),
        });

        continue;
      }

      const uploadUri = photo.processedLocalUri || photo.uri;
      const previewLocalUri = await prepareRoutePhotoPreview(
        record.jobId,
        photo.id,
        photo.uri,
      );
      const { fileName, previewFileName } = await uploadRoutePhotoWithPreview(
        record.userId,
        uploadUri,
        previewLocalUri,
      );
      uploadedFileNames[index] = fileName;
      uploadedPreviewFileNames[index] = previewFileName;
      completedSteps += 1;

      store.workerUploadTick({
        jobId: record.jobId,
        currentImageIndex: index,
        totalImages: record.photosMeta.length,
        previewUri: tickPreviewUri,
        subtitleLine: `Fotoğraf ${index + 1} / ${record.photosMeta.length} yüklendi`,
        progress01: computeProgress01(completedSteps, totalSteps),
      });
    }

    const finalRoutePoints = routePoints.map((point, index) => {
      const uploadedFileName = uploadedFileNames[index];
      const uploadedPreviewFileName = uploadedPreviewFileNames[index];

      if (!uploadedFileName) {
        throw new Error('Tüm görseller doğrulanamadı');
      }

      return {
        ...point,
        image_url: uploadedFileName,
        ...(uploadedPreviewFileName
          ? { image_preview_url: uploadedPreviewFileName }
          : {}),
      };
    });

    store.workerCreating({
      previewUri: record.photosMeta[0]?.processedLocalUri || record.photosMeta[0]?.uri || null,
      subtitleLine: 'Gönderi kaydediliyor',
      progress01: computeProgress01(completedSteps, totalSteps),
    });

    const { data: createdRoute, error } = await RouteModel.createRoute(
      finalRoutePoints,
      record.selectedCity?.id || 0,
      record.selectedCategory?.id || null,
    );

    if (error || !createdRoute?.[0]?.id) {
      throw new Error('Rota kaydedilemedi');
    }

    const mainRouteId = createdRoute[0].id;

    completedSteps += 1;
    await clearDraftStorage(record.jobId);
    await clearWizardDraft(record.jobId);


    require('../store/createRouteFlowStore').useCreateRouteFlowStore.getState().completeFlow();

    store.workerSuccess({
      progress01: 1,
      routeId: mainRouteId,
      meta: {
        cityName: record.selectedCity?.name,
        categoryName: record.selectedCategory?.name,
        previewUri:
          record.photosMeta[0]?.processedLocalUri || record.photosMeta[0]?.uri || null,
        stopCount: record.routeStops.length,
        stopTitles: record.routeStops
          .map((stop) => stop.title.trim())
          .filter((title) => title.length > 0),
      },
    });

    triggerAchievementChecks([record.userId]);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
    await markDraftFailed(record, message);
    store.workerFailed({ lastError: message, draftSaved: true });
  }
}
