import type { RouteStop } from '../screens/CreateRoute/StopDetailsScreen';
import type { Category, City } from '../screens/CreateRoute/CategorySelectionScreen';

export type PhotoUploadStatus =
  | 'pending'
  | 'processing'
  | 'uploading'
  | 'done'
  | 'failed';

export interface CreateFlowPhoto {
  id: string;
  uri: string;
  fileName?: string;
  type?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  uploadStatus: PhotoUploadStatus;
  processedLocalUri?: string;
  storageFileName?: string;
  storageThumbFileName?: string;
  storageMediumFileName?: string;
  /** @deprecated storageThumbFileName */
  storagePreviewFileName?: string;
  uploadError?: string;
}

export type WizardStep = 'photo' | 'stops' | 'category';

export interface RouteWizardDraftRecord {
  version: 1;
  jobId: string;
  photos: CreateFlowPhoto[];
  routeStops: RouteStop[];
  selectedCategory: Category | null;
  selectedCity: City | null;
  savedAt: string;
  wizardStep: WizardStep;
  userId: string;
}

/** @deprecated Use CreateFlowPhoto — kept for gradual migration */
export type Photo = CreateFlowPhoto;
