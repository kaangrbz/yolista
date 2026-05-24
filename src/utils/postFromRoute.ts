import type { RouteWithProfile } from '../model/routes.model';
import type { Post } from '../types/post.types';
import type { PostImageSlide } from '../types/postImage.types';
import { normalizeImageDimension } from './imageUtils';

export function postFromRouteWithProfile(route: RouteWithProfile): Post {
  const routeId = route.id ?? '';

  return {
    id: routeId,
    title: route.title,
    description: route.description,
    image_url: route.image_url,
    user_id: route.user_id ?? '',
    created_at: route.created_at ?? '',
    like_count: route.like_count ?? 0,
    comment_count: route.comment_count ?? 0,
    did_like: route.did_like ?? false,
    is_deleted: route.is_deleted ?? false,
    profiles: route.profiles
      ? {
          username: route.profiles.username,
          full_name: route.profiles.full_name,
          image_url: route.profiles.image_url,
          image_preview_url: route.profiles.image_preview_url,
          is_verified: route.profiles.is_verified ?? false,
        }
      : undefined,
    cities: route.cities,
    categories: route.categories,
  };
}

export function leadSlideFromRoute(
  route: RouteWithProfile,
): Pick<PostImageSlide, 'width' | 'height' | 'imageAlignment'> {
  return {
    width: normalizeImageDimension(route.image_width ?? undefined),
    height: normalizeImageDimension(route.image_height ?? undefined),
    imageAlignment: route.image_alignment ?? null,
  };
}
