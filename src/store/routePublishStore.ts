import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/alert';
import { loadDraftRecord } from '../services/routeDraftStorage';
import {
  beginRoutePublishFromEnqueue,
  executeRoutePublish,
} from '../services/RoutePublishWorker';
import { saveDraftRecord } from '../services/routeDraftStorage';
import type { RoutePublishEnqueuePayload } from '../services/routePublishTypes';

export type PublishPhase = 'idle' | 'uploading' | 'creating' | 'success' | 'failed';

export interface PublishedRouteMeta {
  cityName?: string;
  categoryName?: string;
  previewUri?: string | null;
  stopCount?: number;
  stopTitles?: string[];
  authorUsername?: string;
}

interface WorkerUploadPayload {
  jobId: string;
  currentImageIndex: number;
  totalImages: number;
  previewUri: string | null;
  subtitleLine: string;
  progress01: number;
}

interface RoutePublishState {
  phase: PublishPhase;
  jobId: string | null;
  /** Same draft hidden until new publish or retry */
  failureDismissedJobId: string | null;
  progress01: number;
  currentImageIndex: number;
  totalImages: number;
  previewUri: string | null;
  subtitleLine: string;
  lastError: string | null;
  draftSaved: boolean;
  publishedRouteId: string | null;
  publishedRouteMeta: PublishedRouteMeta | null;
  sharePromptVisible: boolean;
  enqueue: (payload: RoutePublishEnqueuePayload) => Promise<boolean>;
  dismissFailure: () => void;
  dismissSharePrompt: () => void;
  resetAfterSuccess: () => void;
  retryFromDraft: () => Promise<void>;
  resumePendingDraftIfAny: () => Promise<void>;
  hydrateFailedDraftIfNeeded: () => Promise<void>;
  workerUploadTick: (payload: WorkerUploadPayload) => void;
  workerCreating: (payload: {
    previewUri: string | null;
    subtitleLine: string;
    progress01: number;
  }) => void;
  workerSuccess: (payload: {
    progress01: number;
    routeId: string;
    meta: PublishedRouteMeta;
  }) => void;
  workerFailed: (payload: { lastError: string; draftSaved: boolean }) => void;
}

export const useRoutePublishStore = create<RoutePublishState>((set, get) => ({
  phase: 'idle',
  jobId: null,
  failureDismissedJobId: null,
  progress01: 0,
  currentImageIndex: 0,
  totalImages: 0,
  previewUri: null,
  subtitleLine: '',
  lastError: null,
  draftSaved: false,
  publishedRouteId: null,
  publishedRouteMeta: null,
  sharePromptVisible: false,

  workerUploadTick: (payload) => {
    set({
      failureDismissedJobId: null,
      phase: 'uploading',
      jobId: payload.jobId,
      currentImageIndex: payload.currentImageIndex,
      totalImages: payload.totalImages,
      previewUri: payload.previewUri,
      subtitleLine: payload.subtitleLine,
      progress01: payload.progress01,
      lastError: null,
      draftSaved: false,
    });
  },

  workerCreating: (payload) => {
    set({
      phase: 'creating',
      previewUri: payload.previewUri,
      subtitleLine: payload.subtitleLine,
      progress01: payload.progress01,
    });
  },

  workerSuccess: (payload) => {
    set({
      phase: 'success',
      progress01: payload.progress01,
      lastError: null,
      draftSaved: false,
      publishedRouteId: payload.routeId,
      publishedRouteMeta: payload.meta,
      sharePromptVisible: true,
    });

    showToast('success', 'Rota başarıyla paylaşıldı', 'Başarılı');

    setTimeout(() => {
      if (get().phase === 'success') {
        get().resetAfterSuccess();
      }
    }, 2200);
  },

  workerFailed: (payload) => {
    set({
      phase: 'failed',
      failureDismissedJobId: null,
      lastError: payload.lastError,
      draftSaved: payload.draftSaved,
      progress01: 0,
    });

    showToast('error', payload.lastError, 'Paylaşım hatası');
  },

  enqueue: async (payload) => {
    const busy =
      get().phase === 'uploading' || get().phase === 'creating';

    if (busy) {
      showToast('info', 'Zaten bir paylaşım işlemi devam ediyor', 'Bekleyin');

      return false;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      showToast('error', 'Lütfen tekrar giriş yapınız', 'Hata');

      return false;
    }

    set({
      phase: 'uploading',
      failureDismissedJobId: null,
      jobId: null,
      progress01: 0,
      lastError: null,
      draftSaved: false,
      subtitleLine: 'Hazırlanıyor',
      totalImages: payload.selectedPhotos.length,
      currentImageIndex: 0,
      previewUri: payload.selectedPhotos[0]?.uri || null,
      publishedRouteId: null,
      publishedRouteMeta: null,
      sharePromptVisible: false,
    });

    beginRoutePublishFromEnqueue(payload, user.id).catch(() => {
      // Errors handled inside beginRoutePublishFromEnqueue / executeRoutePublish
    });

    return true;
  },

  dismissSharePrompt: () => {
    set({
      publishedRouteId: null,
      publishedRouteMeta: null,
      sharePromptVisible: false,
    });
  },

  dismissFailure: () => {
    const currentJobId = get().jobId;

    set({
      phase: 'idle',
      jobId: null,
      failureDismissedJobId: currentJobId,
      progress01: 0,
      lastError: null,
      draftSaved: false,
      previewUri: null,
      subtitleLine: '',
    });
  },

  resetAfterSuccess: () => {
    set({
      phase: 'idle',
      jobId: null,
      failureDismissedJobId: null,
      progress01: 0,
      currentImageIndex: 0,
      totalImages: 0,
      previewUri: null,
      subtitleLine: '',
      lastError: null,
      draftSaved: false,
    });
  },

  retryFromDraft: async () => {
    const busy =
      get().phase === 'uploading' || get().phase === 'creating';

    if (busy) {
      showToast('info', 'Zaten bir paylaşım işlemi devam ediyor', 'Bekleyin');

      return;
    }

    const draft = await loadDraftRecord();

    if (!draft || draft.status !== 'failed') {
      showToast('error', 'Taslak bulunamadı', 'Hata');

      return;
    }

    const refreshed: typeof draft = {
      ...draft,
      status: 'pending',
      failedReason: undefined,
    };

    await saveDraftRecord(refreshed);

    set({
      phase: 'uploading',
      failureDismissedJobId: null,
      lastError: null,
      draftSaved: false,
      subtitleLine: 'Yeniden deneniyor',
    });

    executeRoutePublish(refreshed).catch(() => {
      // Handled inside executeRoutePublish
    });
  },

  hydrateFailedDraftIfNeeded: async () => {
    const busy =
      get().phase === 'uploading' || get().phase === 'creating';

    if (busy) {
      return;
    }

    const draft = await loadDraftRecord();

    if (!draft || draft.status !== 'failed') {
      return;
    }

    if (draft.jobId === get().failureDismissedJobId) {
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== draft.userId) {
      return;
    }

    set({
      phase: 'failed',
      jobId: draft.jobId,
      lastError: draft.failedReason || 'Paylaşım tamamlanamadı',
      draftSaved: true,
      previewUri: draft.photosMeta[0]?.uri || null,
      totalImages: draft.photosMeta.length,
      subtitleLine: 'Taslak kaydedildi',
      progress01: 0,
    });
  },

  resumePendingDraftIfAny: async () => {
    const busy =
      get().phase === 'uploading' || get().phase === 'creating';

    if (busy) {
      return;
    }

    const draft = await loadDraftRecord();

    if (!draft || draft.status !== 'pending') {
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== draft.userId) {
      return;
    }

    set({
      phase: 'uploading',
      jobId: draft.jobId,
      totalImages: draft.photosMeta.length,
      subtitleLine: 'Paylaşım sürdürülüyor',
      previewUri: draft.photosMeta[0]?.uri || null,
    });

    executeRoutePublish(draft).catch(() => {
      // Handled inside executeRoutePublish
    });
  },
}));
