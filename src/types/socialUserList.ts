export type SocialUserListRouteParams =
  | { kind: 'followers'; userId: string }
  | { kind: 'following'; userId: string }
  | { kind: 'route_likers'; routeId: string; likeCount?: number };

export function isSocialUserListParams(
  value: unknown,
): value is SocialUserListRouteParams {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  const kind = record.kind;

  if (kind === 'followers' || kind === 'following') {
    return typeof record.userId === 'string' && record.userId.length > 0;
  }

  if (kind === 'route_likers') {
    return typeof record.routeId === 'string' && record.routeId.length > 0;
  }

  return false;
}
