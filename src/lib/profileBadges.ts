import { ImageSourcePropType } from 'react-native';
import { supabase } from './supabase';
import { Icon } from '../assets';
import type { ProfileBadge } from '../model/profile.model';

// Maps asset_key from profile_badge_types.icon_value to a local RN asset.
// Components that render an asset_key badge use this map to resolve the
// image source; unknown keys fall back to a circle placeholder.
export const PROFILE_BADGE_ASSETS: Record<
  string,
  { source: ImageSourcePropType; tintColor?: string }
> = {
  yolista_logo_green: { source: Icon, tintColor: '#16A34A' },
};

// Process-wide cache for the badge catalog. The catalog rarely changes, so we
// fetch it lazily on first use and reuse the result. Pass `force` to refresh.
let catalogPromise: Promise<ProfileBadge[]> | null = null;

export async function fetchBadgesForUser(userId: string): Promise<ProfileBadge[]> {
  if (!userId) return [];

  const { data, error } = await supabase.rpc('get_profile_badges', {
    p_user_id: userId,
  });

  if (error) {
    console.warn('fetchBadgesForUser:', error.message);
    return [];
  }

  return (data ?? []) as ProfileBadge[];
}

export async function fetchBadgeCatalog(force = false): Promise<ProfileBadge[]> {
  if (!force && catalogPromise) return catalogPromise;

  catalogPromise = (async () => {
    const { data, error } = await supabase.rpc('list_profile_badge_types');
    if (error) {
      console.warn('fetchBadgeCatalog:', error.message);
      catalogPromise = null;
      return [];
    }
    return (data ?? []) as ProfileBadge[];
  })();

  return catalogPromise;
}

export function pickPrimaryBadges(
  badges: ProfileBadge[],
  max = 2,
): ProfileBadge[] {
  if (badges.length <= max) return badges;
  // Prefer surfacing negative badges first (warning to viewers), then positives.
  const negatives = badges.filter((b) => b.category === 'negative');
  const positives = badges.filter((b) => b.category === 'positive');
  const neutrals = badges.filter((b) => b.category === 'neutral');
  return [...negatives, ...positives, ...neutrals].slice(0, max);
}
