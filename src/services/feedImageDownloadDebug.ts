/** Feed resim indirme logları — true yapınca konsola yazar. */
export const FEED_IMAGE_DOWNLOAD_DEBUG = false;

export function feedImageDownloadLog(
  event: string,
  details?: Record<string, unknown>,
): void {
  if (!FEED_IMAGE_DOWNLOAD_DEBUG) {
    return;
  }

  if (details) {
    console.log(`[FeedImageDownload] ${event}`, details);
    return;
  }

  console.log(`[FeedImageDownload] ${event}`);
}
