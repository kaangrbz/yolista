/** Kod içi varsayılanlar — DB okunamazsa kullanılır. */
export const DEFAULT_ROUTE_IMAGE_SIZES = {
  thumb: 168,
  medium: 512,
  full: 1920,
} as const;

export const DEFAULT_ROUTE_IMAGE_JPEG_QUALITY = 80;

export type RouteImageVariant = keyof typeof DEFAULT_ROUTE_IMAGE_SIZES;

export interface RouteImageUrls {
  thumb?: string | null;
  medium?: string | null;
  full?: string | null;
}

export interface RouteImagePolicy {
  thumb_size_px: number;
  medium_size_px: number;
  full_max_px: number;
  jpeg_quality: number;
}

export function resolveRouteImagePath(
  variant: RouteImageVariant,
  urls: RouteImageUrls,
  options?: { strict?: boolean },
): string | null {
  const thumb = urls.thumb?.trim() || null;
  const medium = urls.medium?.trim() || null;
  const full = urls.full?.trim() || null;

  const chains: Record<RouteImageVariant, Array<string | null>> = {
    thumb: options?.strict ? [thumb] : [thumb, medium, full],
    medium: [medium, full, thumb],
    full: [full, medium, thumb],
  };

  for (const candidate of chains[variant]) {
    if (candidate) {
      return candidate;
    }
  }

  return null;
}

export function mergeRouteImagePolicy(
  row: Partial<RouteImagePolicy> | null | undefined,
): RouteImagePolicy {
  return {
    thumb_size_px: row?.thumb_size_px ?? DEFAULT_ROUTE_IMAGE_SIZES.thumb,
    medium_size_px: row?.medium_size_px ?? DEFAULT_ROUTE_IMAGE_SIZES.medium,
    full_max_px: row?.full_max_px ?? DEFAULT_ROUTE_IMAGE_SIZES.full,
    jpeg_quality: row?.jpeg_quality ?? DEFAULT_ROUTE_IMAGE_JPEG_QUALITY,
  };
}
