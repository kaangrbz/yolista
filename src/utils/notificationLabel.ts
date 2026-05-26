const NOTIFICATION_MESSAGE_PREVIEW_MAX_LENGTH = 80;

function normalizeNotificationMessagePreview(message: string): string {
  return message.replace(/\s+/g, ' ').trim();
}

function truncateNotificationMessagePreview(
  message: string,
  maxLength = NOTIFICATION_MESSAGE_PREVIEW_MAX_LENGTH,
): string {
  const normalized = normalizeNotificationMessagePreview(message);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

export function formatNotificationActionLabel(
  baseLabel: string,
  message?: string | null,
): string {
  if (!message?.trim()) {
    return baseLabel;
  }

  return `${baseLabel}: ${truncateNotificationMessagePreview(message)}`;
}
