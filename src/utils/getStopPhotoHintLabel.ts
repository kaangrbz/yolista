type StopHintSource = {
  title?: string | null;
  order_index?: number;
};

/** DB `routes.title` — kısa fotoğraf ipucu; yoksa boş döner. */
export function getStopPhotoHintLabel(stop: StopHintSource): string {
  return stop.title?.trim() || '';
}
