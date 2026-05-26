import { create } from 'zustand';
import { randomString } from '../utils/randomString';
import type {
  CreateFlowPhoto,
  PhotoUploadStatus,
  WizardStep,
} from '../types/createRouteFlowTypes';
import type { RouteStop } from '../screens/CreateRoute/StopDetailsScreen';
import type { Category, City } from '../screens/CreateRoute/CategorySelectionScreen';
import { enqueuePhotoUploads } from '../services/RoutePhotoUploadService';
import type { RouteWizardDraftRecord } from '../types/createRouteFlowTypes';

function normalizePickerPhoto(
  photo: Omit<CreateFlowPhoto, 'uploadStatus'>,
): CreateFlowPhoto {
  return {
    ...photo,
    uploadStatus: 'pending',
  };
}

function patchPhoto(
  photos: CreateFlowPhoto[],
  patch: Partial<CreateFlowPhoto> & { id: string },
): CreateFlowPhoto[] {
  return photos.map((photo) => {
    if (photo.id !== patch.id) {
      return photo;
    }

    return { ...photo, ...patch };
  });
}

interface CreateRouteFlowState {
  jobId: string | null;
  flowSessionId: number;
  photos: CreateFlowPhoto[];
  routeStops: RouteStop[];
  selectedCategory: Category | null;
  selectedCity: City | null;
  wizardStep: WizardStep;
  isDirty: boolean;

  ensureJobId: () => string;
  setPhotosFromPicker: (incoming: Array<Omit<CreateFlowPhoto, 'uploadStatus'>>) => void;
  removePhoto: (photoId: string) => void;
  reorderPhotos: (fromIndex: number, toIndex: number) => void;
  patchPhotoUpload: (patch: Partial<CreateFlowPhoto> & { id: string }) => void;
  retryPhotoUpload: (photoId: string) => void;
  setRouteStops: (stops: RouteStop[]) => void;
  setStopLocation: (
    stopId: string,
    location: { latitude: number; longitude: number; address?: string },
  ) => void;
  clearStopLocation: (stopId: string) => void;
  /** Seçili durağın konumunu tüm duraklara kopyalar. */
  applyLocationToAllStops: (sourceStopId: string) => boolean;
  setCategoryCity: (category: Category | null, city: City | null) => void;
  setWizardStep: (step: WizardStep) => void;
  markDirty: () => void;
  hydrateFromWizardDraft: (draft: RouteWizardDraftRecord) => void;
  resetFlow: () => void;
  completeFlow: () => void;
  getSnapshotForDraft: () => {
    jobId: string;
    photos: CreateFlowPhoto[];
    routeStops: RouteStop[];
    selectedCategory: Category | null;
    selectedCity: City | null;
    wizardStep: WizardStep;
  } | null;
  hasUnsavedChanges: () => boolean;
  allUploadsDone: () => boolean;
  anyUploadInProgress: () => boolean;
  waitUntilUploadsSettled: (timeoutMs?: number) => Promise<boolean>;
}

export const useCreateRouteFlowStore = create<CreateRouteFlowState>((set, get) => ({
  jobId: null,
  flowSessionId: 0,
  photos: [],
  routeStops: [],
  selectedCategory: null,
  selectedCity: null,
  wizardStep: 'photo',
  isDirty: false,

  ensureJobId: () => {
    const existing = get().jobId;

    if (existing) {
      return existing;
    }

    const jobId = randomString(16);
    set({ jobId });

    return jobId;
  },

  setPhotosFromPicker: (incoming) => {
    const jobId = get().ensureJobId();
    const oldById = new Map(get().photos.map((photo) => [photo.id, photo]));

    const merged: CreateFlowPhoto[] = incoming.map((photo) => {
      const existing = oldById.get(photo.id);

      if (existing) {
        return existing;
      }

      return normalizePickerPhoto(photo);
    });

    const added = merged.filter((photo) => !oldById.has(photo.id));
    set({ photos: merged, isDirty: true });

    if (added.length > 0) {
      enqueuePhotoUploads(jobId, merged, (patch) => {
        get().patchPhotoUpload(patch);
      });
    }
  },

  removePhoto: (photoId) => {
    set((state) => ({
      photos: state.photos.filter((photo) => photo.id !== photoId),
      routeStops: state.routeStops.filter((stop) => stop.photoId !== photoId),
      isDirty: true,
    }));
  },

  reorderPhotos: (fromIndex, toIndex) => {
    const photos = [...get().photos];
    const routeStops = [...get().routeStops];
    const [movedPhoto] = photos.splice(fromIndex, 1);
    photos.splice(toIndex, 0, movedPhoto);

    const stopByPhotoId = new Map(routeStops.map((stop) => [stop.photoId, stop]));
    const reorderedStops = photos
      .map((photo) => stopByPhotoId.get(photo.id))
      .filter((stop): stop is RouteStop => !!stop);

    set({ photos, routeStops: reorderedStops, isDirty: true });
  },

  patchPhotoUpload: (patch) => {
    set((state) => ({
      photos: patchPhoto(state.photos, patch),
    }));
  },

  retryPhotoUpload: (photoId) => {
    const jobId = get().jobId;
    const photo = get().photos.find((item) => item.id === photoId);

    if (!jobId || !photo) {
      return;
    }

    get().patchPhotoUpload({
      id: photoId,
      uploadStatus: 'pending' as PhotoUploadStatus,
      uploadError: undefined,
    });

    enqueuePhotoUploads(jobId, get().photos, (patch) => {
      get().patchPhotoUpload(patch);
    });
  },

  setRouteStops: (stops) => {
    set({ routeStops: stops, isDirty: true });
  },

  setStopLocation: (stopId, location) => {
    set((state) => ({
      routeStops: state.routeStops.map((stop) =>
        stop.id === stopId
          ? {
              ...stop,
              coordinate: {
                latitude: location.latitude,
                longitude: location.longitude,
              },
              address: location.address?.trim() || stop.address,
            }
          : stop,
      ),
      isDirty: true,
    }));
  },

  clearStopLocation: (stopId) => {
    set((state) => ({
      routeStops: state.routeStops.map((stop) =>
        stop.id === stopId
          ? { ...stop, coordinate: undefined, address: undefined }
          : stop,
      ),
      isDirty: true,
    }));
  },

  applyLocationToAllStops: (sourceStopId) => {
    const source = get().routeStops.find((stop) => stop.id === sourceStopId);

    if (
      !source?.coordinate ||
      typeof source.coordinate.latitude !== 'number' ||
      typeof source.coordinate.longitude !== 'number'
    ) {
      return false;
    }

    set((state) => ({
      routeStops: state.routeStops.map((stop) => ({
        ...stop,
        coordinate: {
          latitude: source.coordinate!.latitude,
          longitude: source.coordinate!.longitude,
        },
        address: source.address,
      })),
      isDirty: true,
    }));

    return true;
  },

  setCategoryCity: (category, city) => {
    set({
      selectedCategory: category,
      selectedCity: city,
      isDirty: true,
    });
  },

  setWizardStep: (step) => {
    set({ wizardStep: step });
  },

  markDirty: () => {
    set({ isDirty: true });
  },

  hydrateFromWizardDraft: (draft) => {
    set({
      jobId: draft.jobId,
      photos: draft.photos,
      routeStops: draft.routeStops,
      selectedCategory: draft.selectedCategory,
      selectedCity: draft.selectedCity,
      wizardStep: draft.wizardStep,
      isDirty: false,
    });

    const pending = draft.photos.filter(
      (photo) => photo.uploadStatus === 'pending' || photo.uploadStatus === 'failed',
    );

    if (pending.length > 0) {
      enqueuePhotoUploads(draft.jobId, draft.photos, (patch) => {
        get().patchPhotoUpload(patch);
      });
    }
  },

  resetFlow: () => {
    set({
      jobId: null,
      photos: [],
      routeStops: [],
      selectedCategory: null,
      selectedCity: null,
      wizardStep: 'photo',
      isDirty: false,
    });
  },

  completeFlow: () => {
    set((state) => ({
      jobId: null,
      flowSessionId: state.flowSessionId + 1,
      photos: [],
      routeStops: [],
      selectedCategory: null,
      selectedCity: null,
      wizardStep: 'photo',
      isDirty: false,
    }));
  },

  getSnapshotForDraft: () => {
    const { jobId, photos, routeStops, selectedCategory, selectedCity, wizardStep } = get();

    if (!jobId || photos.length === 0) {
      return null;
    }

    return {
      jobId,
      photos,
      routeStops,
      selectedCategory,
      selectedCity,
      wizardStep,
    };
  },

  hasUnsavedChanges: () => {
    const state = get();

    if (state.photos.length > 0) {
      return true;
    }

    const hasStopText = state.routeStops.some(
      (stop) =>
        stop.title.trim().length > 0 ||
        (stop.description || '').trim().length > 0 ||
        !!stop.coordinate,
    );

    if (hasStopText) {
      return true;
    }

    if (state.anyUploadInProgress()) {
      return true;
    }

    return state.isDirty;
  },

  allUploadsDone: () => {
    const { photos } = get();

    if (photos.length === 0) {
      return false;
    }

    return photos.every((photo) => photo.uploadStatus === 'done');
  },

  anyUploadInProgress: () => {
    return get().photos.some(
      (photo) =>
        photo.uploadStatus === 'pending' ||
        photo.uploadStatus === 'processing' ||
        photo.uploadStatus === 'uploading',
    );
  },

  waitUntilUploadsSettled: async (timeoutMs = 120000) => {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const { photos } = get();
      const settled = photos.every(
        (photo) => photo.uploadStatus === 'done' || photo.uploadStatus === 'failed',
      );

      if (settled) {
        return photos.every((photo) => photo.uploadStatus === 'done');
      }

      await new Promise<void>((resolve) => setTimeout(() => resolve(), 400));
    }

    return false;
  },
}));
