import type { CreateFlowPhoto as Photo } from '../types/createRouteFlowTypes';
import type { RouteStop } from '../screens/CreateRoute/StopDetailsScreen';
import type { Category, City } from '../screens/CreateRoute/CategorySelectionScreen';

export interface RoutePublishEnqueuePayload {
  selectedPhotos: Photo[];
  routeStops: RouteStop[];
  selectedCategory: Category | null;
  selectedCity: City | null;
}

export interface RoutePublishDraftRecord {
  jobId: string;
  version: 1;
  status: 'pending' | 'failed';
  failedReason?: string;
  /** Local file paths (no file:// prefix) under app documents */
  localPhotoPaths: string[];
  photosMeta: Photo[];
  routeStops: RouteStop[];
  selectedCategory: Category | null;
  selectedCity: City | null;
  userId: string;
}
