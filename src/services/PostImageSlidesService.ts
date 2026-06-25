import { supabase } from '../lib/supabase';
import { ImageService } from './ImageService';
import {
  FeedImageDownloadCancelledError,
  feedImageDownloadQueue,
} from './FeedImageDownloadQueue';
import { feedImageDownloadLog } from './feedImageDownloadDebug';
import type { RouteImageAlignment } from '../model/routes.model';
import type { PostImageSlide } from '../types/postImage.types';
import { normalizeImageDimension } from '../utils/imageUtils';

export const ROUTE_IMAGE_SELECT =
  'id, parent_id, image_url, image_thumb_url, image_medium_url, order_index, user_id, image_width, image_height, image_alignment, title';

export interface RouteImageRow {
  id: string;
  parent_id?: string | null;
  image_url: string | null;
  image_thumb_url?: string | null;
  image_medium_url?: string | null;
  order_index: number;
  user_id: string | null;
  image_width?: number | null;
  image_height?: number | null;
  image_alignment?: RouteImageAlignment | null;
  title?: string | null;
}

export type SlidesByPostId = Record<string, PostImageSlide[]>;
export type RouteRowsByPostId = Record<string, RouteImageRow[]>;

export interface StopMeta {
  count: number;
  titles: string[];
}

export type StopMetaByPostId = Record<string, StopMeta>;

const STOP_META_SELECT = 'id, parent_id, order_index, title';

function mapRouteRowToSlideMeta(route: RouteImageRow) {
  const hint = route.title?.trim() || null;

  return {
    hint,
    width: normalizeImageDimension(route.image_width ?? undefined),
    height: normalizeImageDimension(route.image_height ?? undefined),
    imageAlignment: route.image_alignment ?? null,
    imageUrl: route.image_url,
    imageThumbUrl: route.image_thumb_url ?? null,
    imageMediumUrl: route.image_medium_url ?? null,
    userId: route.user_id ?? null,
  };
}

export function resolvePostIdForImageRow(row: RouteImageRow): string {
  if (row.order_index === 0) {
    return row.id;
  }

  return row.parent_id ?? row.id;
}

export function groupImageRowsByPostId(rows: RouteImageRow[]): RouteRowsByPostId {
  const grouped: RouteRowsByPostId = {};

  for (const row of rows) {
    const postId = resolvePostIdForImageRow(row);

    if (!grouped[postId]) {
      grouped[postId] = [];
    }

    grouped[postId].push(row);
  }

  for (const postId of Object.keys(grouped)) {
    grouped[postId].sort((left, right) => left.order_index - right.order_index);
  }

  return grouped;
}

export function metaSlidesFromRows(rows: RouteImageRow[]): PostImageSlide[] {
  return rows.map((row) => ({
    uri: null,
    ...mapRouteRowToSlideMeta(row),
  }));
}

function buildPostIdsFilter(postIds: string[]): string {
  return postIds
    .map((postId) => `id.eq.${postId},parent_id.eq.${postId}`)
    .join(',');
}

export async function fetchRouteImageRowsForPosts(postIds: string[]) {
  const uniqueIds = [...new Set(postIds.filter(Boolean))];

  if (uniqueIds.length === 0) {
    return { data: [] as RouteImageRow[], error: null };
  }

  return supabase
    .from('routes')
    .select(ROUTE_IMAGE_SELECT)
    .or(buildPostIdsFilter(uniqueIds))
    .eq('is_deleted', false)
    .eq('is_hidden', false)
    .not('image_url', 'is', null)
    .order('order_index', { ascending: true });
}

export function groupStopMetaByPostId(
  rows: Pick<RouteImageRow, 'id' | 'parent_id' | 'order_index' | 'title'>[],
): StopMetaByPostId {
  const grouped: Record<string, Pick<RouteImageRow, 'id' | 'parent_id' | 'order_index' | 'title'>[]> = {};

  for (const row of rows) {
    const postId = resolvePostIdForImageRow(row as RouteImageRow);

    if (!grouped[postId]) {
      grouped[postId] = [];
    }

    grouped[postId].push(row);
  }

  const result: StopMetaByPostId = {};

  for (const postId of Object.keys(grouped)) {
    const sorted = [...grouped[postId]].sort(
      (left, right) => left.order_index - right.order_index,
    );
    const titles = sorted
      .map((row) => row.title?.trim() ?? '')
      .filter((title) => title.length > 0);

    result[postId] = {
      count: sorted.length,
      titles,
    };
  }

  return result;
}

export async function fetchStopMetaForPosts(postIds: string[]) {
  const uniqueIds = [...new Set(postIds.filter(Boolean))];

  if (uniqueIds.length === 0) {
    return { data: {} as StopMetaByPostId, error: null };
  }

  const result = await supabase
    .from('routes')
    .select(STOP_META_SELECT)
    .or(buildPostIdsFilter(uniqueIds))
    .eq('is_deleted', false)
    .eq('is_hidden', false)
    .order('order_index', { ascending: true });

  if (result.error) {
    return { data: {} as StopMetaByPostId, error: result.error };
  }

  const grouped = groupStopMetaByPostId(result.data ?? []);
  const completeMeta: StopMetaByPostId = {};

  for (const postId of uniqueIds) {
    completeMeta[postId] = grouped[postId] ?? { count: 0, titles: [] };
  }

  return { data: completeMeta, error: null };
}

export async function fetchRouteImageRowsForPost(postId: string) {
  const result = await fetchRouteImageRowsForPosts([postId]);

  if (result.error) {
    return result;
  }

  const grouped = groupImageRowsByPostId(result.data ?? []);

  return {
    data: grouped[postId] ?? [],
    error: null,
  };
}

async function downloadRouteAsSlide(route: RouteImageRow): Promise<PostImageSlide> {
  const meta = mapRouteRowToSlideMeta(route);

  if (!route.image_url || !route.user_id) {
    return {
      uri: null,
      ...meta,
    };
  }

  try {
    // Gönderi galerisi: tam çözünürlük (image_url). Harita: thumb/medium (ayrı akış).
    const imageUri = await ImageService.downloadPostImage(route.image_url, route.user_id);

    return {
      uri: imageUri,
      ...meta,
    };
  } catch {
    return {
      uri: null,
      ...meta,
    };
  }
}

export function getSlideWindowIndices(
  currentIndex: number,
  length: number,
  prefetchAhead = 1,
): number[] {
  if (length <= 0) {
    return [];
  }

  const start = Math.max(0, currentIndex);
  const end = Math.min(length - 1, currentIndex + prefetchAhead);
  const indices: number[] = [];

  for (let index = start; index <= end; index += 1) {
    indices.push(index);
  }

  return indices;
}

async function slideFromCacheOnly(route: RouteImageRow): Promise<PostImageSlide> {
  const meta = mapRouteRowToSlideMeta(route);

  if (!route.image_url || !route.user_id) {
    return { uri: null, ...meta };
  }

  const cachedUri = await ImageService.getCachedRouteImageUri(
    route.image_url,
    route.user_id,
  );

  return {
    uri: cachedUri,
    ...meta,
  };
}

export interface DownloadSlidesWithWindowOptions {
  currentIndex: number;
  prefetchAhead?: number;
  eagerSlides?: boolean;
  allowNetwork?: boolean;
  shouldContinue?: () => boolean;
  onSlidesUpdate: (slides: PostImageSlide[]) => void;
  existingSlides?: PostImageSlide[];
  postId?: string;
  postIndex?: number;
  downloadGeneration?: number;
}

export async function downloadSlidesWithWindow(
  routes: RouteImageRow[],
  options: DownloadSlidesWithWindowOptions,
): Promise<PostImageSlide[]> {
  const prefetchAhead = options.prefetchAhead ?? 1;
  const allowNetwork = options.allowNetwork !== false;
  const slides: PostImageSlide[] = options.existingSlides
    ? [...options.existingSlides]
    : metaSlidesFromRows(routes);

  if (!options.existingSlides) {
    options.onSlidesUpdate([...slides]);
  }

  if (routes.length === 0) {
    return slides;
  }

  const indices = options.eagerSlides
    ? routes.map((_, index) => index)
    : getSlideWindowIndices(options.currentIndex, routes.length, prefetchAhead);

  const useDownloadQueue =
    allowNetwork &&
    options.postId !== undefined &&
    options.postIndex !== undefined;
  const postId = options.postId ?? '';
  const postIndex = options.postIndex ?? -1;
  const downloadGeneration = options.downloadGeneration ?? 0;

  feedImageDownloadLog('download window started', {
    postId: options.postId,
    postIndex: options.postIndex,
    currentIndex: options.currentIndex,
    indices,
    allowNetwork,
    useDownloadQueue,
  });

  for (const index of indices) {
    if (options.shouldContinue && !options.shouldContinue()) {
      feedImageDownloadLog('download loop stopped (stale)', {
        postId: options.postId,
        slideIndex: index,
      });
      break;
    }

    if (slides[index]?.uri) {
      feedImageDownloadLog('slide skipped (cached)', {
        postId: options.postId,
        slideIndex: index,
      });
      continue;
    }

    const route = routes[index];

    if (!route) {
      continue;
    }

    try {
      if (useDownloadQueue) {
        await feedImageDownloadQueue.acquire({
          postId,
          postIndex,
          slideIndex: index,
          carouselIndex: options.currentIndex,
          generation: downloadGeneration,
          shouldContinue: options.shouldContinue ?? (() => true),
        });
      }

      try {
        if (allowNetwork) {
          feedImageDownloadLog('downloading slide', {
            postId: options.postId,
            postIndex: options.postIndex,
            slideIndex: index,
          });
          slides[index] = await downloadRouteAsSlide(route);
        } else {
          slides[index] = await slideFromCacheOnly(route);
        }
      } finally {
        if (useDownloadQueue) {
          feedImageDownloadQueue.release(postId, index);
        }
      }
    } catch (error) {
      if (error instanceof FeedImageDownloadCancelledError) {
        feedImageDownloadLog('download cancelled', {
          postId: options.postId,
          slideIndex: index,
          reason: error.message,
        });
        break;
      }

      throw error;
    }

    if (options.shouldContinue && !options.shouldContinue()) {
      feedImageDownloadLog('download aborted after slide (stale)', {
        postId: options.postId,
        slideIndex: index,
      });
      break;
    }

    options.onSlidesUpdate([...slides]);
  }

  feedImageDownloadLog('download window finished', {
    postId: options.postId,
    postIndex: options.postIndex,
    loadedSlides: slides.filter((slide) => slide.uri !== null).length,
  });

  return slides;
}

export async function downloadSlidesProgressive(
  routes: RouteImageRow[],
  onSlidesUpdate: (slides: PostImageSlide[]) => void,
): Promise<PostImageSlide[]> {
  return downloadSlidesWithWindow(routes, {
    currentIndex: 0,
    prefetchAhead: routes.length,
    eagerSlides: true,
    onSlidesUpdate,
  });
}

export function rowsByPostIdToMetaSlides(
  rowsByPostId: RouteRowsByPostId,
): SlidesByPostId {
  const result: SlidesByPostId = {};

  for (const postId of Object.keys(rowsByPostId)) {
    result[postId] = metaSlidesFromRows(rowsByPostId[postId]);
  }

  return result;
}
