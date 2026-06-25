import type { RouteImageAlignment } from '../model/routes.model';

export interface PostImageSlide {
  uri: string | null;
  /** DB `routes.title` — kısa fotoğraf ipucu */
  hint?: string | null;
  width: number | null;
  height: number | null;
  imageAlignment: RouteImageAlignment | null;
  /** SmartImage / indirme kaynağı */
  imageUrl?: string | null;
  imageThumbUrl?: string | null;
  imageMediumUrl?: string | null;
  userId?: string | null;
}

export type PostImageSlideMeta = Pick<
  PostImageSlide,
  'hint' | 'width' | 'height' | 'imageAlignment'
>;
