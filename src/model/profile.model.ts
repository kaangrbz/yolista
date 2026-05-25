export interface Profile {
  id: string;
  username: string;
  full_name: string;
  image_url?: string;
  image_preview_url?: string;
  header_image_url?: string;
  header_image_preview_url?: string;
  description?: string;
  website?: string;
  is_verified: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type ProfileBadgeCategory = 'positive' | 'neutral' | 'negative';
export type ProfileBadgeSource = 'admin' | 'computed';
export type ProfileBadgeIconType = 'material_icon' | 'asset_key' | 'svg_url';

export interface ProfileBadge {
  key: string;
  label: string;
  description: string;
  category: ProfileBadgeCategory;
  source: ProfileBadgeSource;
  icon_type: ProfileBadgeIconType;
  icon_value: string;
  color: string;
  sort_order: number;
  assigned_at: string | null;
}
