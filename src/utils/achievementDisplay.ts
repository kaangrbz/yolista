import type { Achievement, AchievementCategory } from '../model/achievement.model';

export const ACHIEVEMENT_CATEGORY_LABELS: Record<AchievementCategory, string> = {
  profil: 'Profil',
  yolculuk: 'Yolculuk',
  kesif: 'Keşif',
  topluluk: 'Topluluk',
  ozel: 'Özel',
};

export const ACHIEVEMENT_CATEGORY_ORDER: AchievementCategory[] = [
  'profil',
  'yolculuk',
  'kesif',
  'topluluk',
  'ozel',
];

export type AchievementGridItem = Achievement & { locked?: boolean };

export function withAchievementColorAlpha(color: string, alpha: number): string {
  if (color.startsWith('#') && (color.length === 7 || color.length === 4)) {
    const hex =
      color.length === 4
        ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
        : color;
    const a = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, '0');
    return `${hex}${a}`;
  }
  return color;
}

export function groupAchievementsByCategory(
  items: AchievementGridItem[],
): Array<{ category: AchievementCategory; label: string; items: AchievementGridItem[] }> {
  const buckets = new Map<AchievementCategory, AchievementGridItem[]>();

  for (const item of items) {
    const list = buckets.get(item.category) ?? [];
    list.push(item);
    buckets.set(item.category, list);
  }

  return ACHIEVEMENT_CATEGORY_ORDER.filter((category) => buckets.has(category)).map(
    (category) => ({
      category,
      label: ACHIEVEMENT_CATEGORY_LABELS[category],
      items: buckets.get(category) ?? [],
    }),
  );
}

export function sortAchievementsByEarnedAtDesc(earned: Achievement[]): Achievement[] {
  return [...earned].sort((a, b) => {
    const ta = a.earned_at ? new Date(a.earned_at).getTime() : 0;
    const tb = b.earned_at ? new Date(b.earned_at).getTime() : 0;
    if (tb !== ta) {
      return tb - ta;
    }
    return a.sort_order - b.sort_order || a.key.localeCompare(b.key);
  });
}

export function pickRecentEarnedAchievements(
  earned: Achievement[],
  limit = 5,
): Achievement[] {
  return sortAchievementsByEarnedAtDesc(earned).slice(0, limit);
}
