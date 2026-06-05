export type AchievementsRouteParams = {
  userId: string;
  showFullCatalog?: boolean;
  username?: string;
};

export function isAchievementsRouteParams(
  params: unknown,
): params is AchievementsRouteParams {
  if (!params || typeof params !== 'object') {
    return false;
  }
  const p = params as AchievementsRouteParams;
  return typeof p.userId === 'string' && p.userId.length > 0;
}
