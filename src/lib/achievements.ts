import { supabase } from './supabase';
import type { Achievement, NewAchievementGrant } from '../model/achievement.model';
import { showToast } from '../utils/alert';

let catalogPromise: Promise<Achievement[]> | null = null;

const lastEvaluateByUser = new Map<string, number>();
const EVALUATE_DEBOUNCE_MS = 4000;

export async function fetchAchievementCatalog(force = false): Promise<Achievement[]> {
  if (!force && catalogPromise) {
    return catalogPromise;
  }

  catalogPromise = (async () => {
    const { data, error } = await supabase.rpc('list_achievement_definitions');
    if (error) {
      console.warn('fetchAchievementCatalog:', error.message);
      catalogPromise = null;
      return [];
    }
    return (data ?? []) as Achievement[];
  })();

  return catalogPromise;
}

export async function fetchUserAchievements(userId: string): Promise<Achievement[]> {
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase.rpc('get_user_achievements', {
    p_user_id: userId,
  });

  if (error) {
    console.warn('fetchUserAchievements:', error.message);
    return [];
  }

  return (data ?? []) as Achievement[];
}

export async function evaluateUserAchievements(
  userId: string,
): Promise<NewAchievementGrant[]> {
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase.rpc('evaluate_user_achievements', {
    p_user_id: userId,
  });

  if (error) {
    console.warn('evaluateUserAchievements:', error.message);
    return [];
  }

  return (data ?? []) as NewAchievementGrant[];
}

async function getSessionUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Fire-and-forget evaluation with per-user debounce. */
export function triggerAchievementEvaluation(
  userId: string,
  onGranted?: (grants: NewAchievementGrant[]) => void,
): void {
  if (!userId) {
    return;
  }

  const now = Date.now();
  const last = lastEvaluateByUser.get(userId) ?? 0;
  if (now - last < EVALUATE_DEBOUNCE_MS) {
    return;
  }
  lastEvaluateByUser.set(userId, now);

  void evaluateUserAchievements(userId)
    .then(async (grants) => {
      if (grants.length === 0) {
        return;
      }
      const sessionId = await getSessionUserId();
      if (sessionId === userId) {
        showAchievementUnlockToasts(grants);
      }
      onGranted?.(grants);
    })
    .catch((err) => {
      console.warn('triggerAchievementEvaluation:', err);
    });
}

/** Evaluate multiple users (e.g. liker + route owner). */
export function triggerAchievementChecks(userIds: string[]): void {
  const unique = [...new Set(userIds.filter(Boolean))];
  unique.forEach((id) => triggerAchievementEvaluation(id));
}

export function showAchievementUnlockToasts(grants: NewAchievementGrant[]): void {
  if (grants.length === 0) {
    return;
  }
  if (grants.length === 1) {
    showToast('success', `${grants[0].label} başarısını açtın!`);
    return;
  }
  showToast('success', `${grants.length} yeni başarı kazandın!`);
}
