import type { RouteImageAlignment } from '../model/routes.model';

export interface PostImageSlide {
  uri: string | null;
  width: number | null;
  height: number | null;
  imageAlignment: RouteImageAlignment | null;
}

export type PostImageSlideMeta = Pick<
  PostImageSlide,
  'width' | 'height' | 'imageAlignment'
>;
