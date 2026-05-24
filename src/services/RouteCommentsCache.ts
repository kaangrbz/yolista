import type { Comment } from '../model/comment.model';

interface RouteCommentsCacheEntry {
  comments: Comment[];
  draftText: string;
  fetchedAt: number;
}

const entries = new Map<string, RouteCommentsCacheEntry>();

const STALE_MS = 2 * 60 * 1000;

const getEntry = (routeId: string): RouteCommentsCacheEntry | undefined => {
  return entries.get(routeId);
};

export const getCachedRouteCommentCount = (routeId: string): number | null => {
  const entry = getEntry(routeId);

  if (!entry) {
    return null;
  }

  return entry.comments.length;
};

export const getCachedRouteComments = (routeId: string): Comment[] | null => {
  const entry = getEntry(routeId);

  if (!entry) {
    return null;
  }

  return entry.comments;
};

export const getCachedCommentDraft = (routeId: string): string => {
  const entry = getEntry(routeId);

  if (!entry) {
    return '';
  }

  return entry.draftText;
};

export const isRouteCommentsCacheStale = (routeId: string): boolean => {
  const entry = getEntry(routeId);

  if (!entry) {
    return true;
  }

  return Date.now() - entry.fetchedAt > STALE_MS;
};

export const setCachedRouteComments = (
  routeId: string,
  comments: Comment[],
  draftText?: string,
): void => {
  const existing = getEntry(routeId);

  entries.set(routeId, {
    comments,
    draftText: draftText ?? existing?.draftText ?? '',
    fetchedAt: Date.now(),
  });
};

export const setCachedCommentDraft = (routeId: string, draftText: string): void => {
  const existing = getEntry(routeId);

  if (existing) {
    entries.set(routeId, {
      ...existing,
      draftText,
    });

    return;
  }

  entries.set(routeId, {
    comments: [],
    draftText,
    fetchedAt: 0,
  });
};

export const prependCachedRouteComment = (
  routeId: string,
  comment: Comment,
): void => {
  const existing = getEntry(routeId);
  const comments = existing?.comments ?? [];

  const withoutDuplicate = comments.filter((item) => item.id !== comment.id);

  setCachedRouteComments(routeId, [comment, ...withoutDuplicate], existing?.draftText);
};

export const replaceCachedRouteComment = (
  routeId: string,
  tempId: string,
  comment: Comment,
): void => {
  const existing = getEntry(routeId);

  if (!existing) {
    setCachedRouteComments(routeId, [comment]);

    return;
  }

  const comments = existing.comments.map((item) => {
    if (item.id === tempId) {
      return comment;
    }

    return item;
  });

  setCachedRouteComments(routeId, comments, existing.draftText);
};

export const removeCachedRouteCommentByIdPrefix = (
  routeId: string,
  idPrefix: string,
): void => {
  const existing = getEntry(routeId);

  if (!existing) {
    return;
  }

  const comments = existing.comments.filter((item) => !item.id.startsWith(idPrefix));

  setCachedRouteComments(routeId, comments, existing.draftText);
};

export const removeCachedRouteComment = (
  routeId: string,
  commentId: string,
): void => {
  const existing = getEntry(routeId);

  if (!existing) {
    return;
  }

  const comments = existing.comments.filter((item) => item.id !== commentId);

  setCachedRouteComments(routeId, comments, existing.draftText);
};

export const invalidateRouteCommentsCache = (routeId?: string): void => {
  if (routeId) {
    entries.delete(routeId);

    return;
  }

  entries.clear();
};
