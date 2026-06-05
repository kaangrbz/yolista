import { supabase } from '../lib/supabase';
import { ImageService } from './ImageService';
import type { RouteImageAlignment } from '../model/routes.model';
import type { PostImageSlide } from '../types/postImage.types';
import { normalizeImageDimension } from '../utils/imageUtils';

export const ROUTE_IMAGE_SELECT =
  'id, parent_id, image_url, image_preview_url, order_index, user_id, image_width, image_height, image_alignment, title';

export interface RouteImageRow {
  id: string;
  parent_id?: string | null;
  image_url: string | null;
  image_preview_url?: string | null;
  order_index: number;
  user_id: string | null;
  image_width?: number | null;
  image_height?: number | null;
  image_alignment?: RouteImageAlignment | null;
  title?: string | null;
}

export type SlidesByPostId = Record<string, PostImageSlide[]>;
export type RouteRowsByPostId = Record<string, RouteImageRow[]>;

function mapRouteRowToSlideMeta(route: RouteImageRow) {
  const hint = route.title?.trim() || null;

  return {
    hint,
    width: normalizeImageDimension(route.image_width ?? undefined),
    height: normalizeImageDimension(route.image_height ?? undefined),
    imageAlignment: route.image_alignment ?? null,
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
    // Gönderi galerisi: tam çözünürlük (image_url). Harita: image_preview_url (ayrı akış).
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

export async function downloadSlidesProgressive(
  routes: RouteImageRow[],
  onSlidesUpdate: (slides: PostImageSlide[]) => void,
): Promise<PostImageSlide[]> {
  const metaSlides = metaSlidesFromRows(routes);

  onSlidesUpdate(metaSlides);

  if (routes.length === 0) {
    return metaSlides;
  }

  const slides: PostImageSlide[] = [...metaSlides];
  const firstRoute = routes[0];

  if (!firstRoute) {
    return slides;
  }

  slides[0] = await downloadRouteAsSlide(firstRoute);
  onSlidesUpdate([...slides]);

  if (routes.length === 1) {
    return slides;
  }

  const restRoutes = routes.slice(1);
  const restSlides = await Promise.all(restRoutes.map(downloadRouteAsSlide));

  for (let index = 0; index < restSlides.length; index++) {
    slides[index + 1] = restSlides[index];
  }

  onSlidesUpdate([...slides]);

  return slides;
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
