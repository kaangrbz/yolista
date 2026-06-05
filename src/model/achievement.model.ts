export type AchievementCategory = 'profil' | 'yolculuk' | 'kesif' | 'topluluk' | 'ozel';

export type AchievementIconType = 'material_icon' | 'asset_key' | 'svg_url';

export interface Achievement {
  key: string;
  label: string;
  description: string;
  category: AchievementCategory;
  icon_type: AchievementIconType;
  icon_value: string;
  color: string;
  sort_order: number;
  earned_at?: string | null;
  meta?: Record<string, unknown> | null;
}

export interface NewAchievementGrant {
  achievement_key: string;
  label: string;
  earned_at: string;
}
