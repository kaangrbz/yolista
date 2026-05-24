import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import type { RouteWizardDraftRecord } from '../types/createRouteFlowTypes';

const STORAGE_KEY_V2 = 'route_create_wizard_drafts_v2';
const STORAGE_KEY_V1 = 'route_create_wizard_draft_v1';

export type WizardDraftSnapshot = {
  jobId: string;
  photos: RouteWizardDraftRecord['photos'];
  routeStops: RouteWizardDraftRecord['routeStops'];
  selectedCategory: RouteWizardDraftRecord['selectedCategory'];
  selectedCity: RouteWizardDraftRecord['selectedCity'];
  wizardStep: RouteWizardDraftRecord['wizardStep'];
};

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user.id;
}

async function migrateV1IfNeeded(): Promise<RouteWizardDraftRecord[]> {
  const rawV1 = await AsyncStorage.getItem(STORAGE_KEY_V1);

  if (!rawV1) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawV1) as RouteWizardDraftRecord;
    const userId = await getCurrentUserId();

    if (!userId || parsed.userId !== userId) {
      await AsyncStorage.removeItem(STORAGE_KEY_V1);
      return [];
    }

    await AsyncStorage.setItem(STORAGE_KEY_V2, JSON.stringify([parsed]));
    await AsyncStorage.removeItem(STORAGE_KEY_V1);

    return [parsed];
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY_V1);
    return [];
  }
}

async function readAllDrafts(): Promise<RouteWizardDraftRecord[]> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return [];
  }

  const raw = await AsyncStorage.getItem(STORAGE_KEY_V2);

  if (!raw) {
    const migrated = await migrateV1IfNeeded();
    return migrated.filter((draft) => draft.userId === userId);
  }

  try {
    const parsed = JSON.parse(raw) as RouteWizardDraftRecord[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((draft) => draft.userId === userId && draft.photos.length > 0);
  } catch {
    return [];
  }
}

async function writeAllDrafts(drafts: RouteWizardDraftRecord[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_V2, JSON.stringify(drafts));
}

export async function listWizardDrafts(): Promise<RouteWizardDraftRecord[]> {
  const drafts = await readAllDrafts();

  return drafts.sort(
    (left, right) => new Date(right.savedAt).getTime() - new Date(left.savedAt).getTime(),
  );
}

export async function saveWizardDraft(
  snapshot: WizardDraftSnapshot,
  wizardStep: RouteWizardDraftRecord['wizardStep'],
): Promise<boolean> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return false;
  }

  const record: RouteWizardDraftRecord = {
    version: 1,
    jobId: snapshot.jobId,
    photos: snapshot.photos,
    routeStops: snapshot.routeStops,
    selectedCategory: snapshot.selectedCategory,
    selectedCity: snapshot.selectedCity,
    savedAt: new Date().toISOString(),
    wizardStep,
    userId,
  };

  const drafts = await readAllDrafts();
  const withoutCurrent = drafts.filter((draft) => draft.jobId !== snapshot.jobId);

  await writeAllDrafts([record, ...withoutCurrent]);

  return true;
}

export async function loadWizardDraft(jobId?: string): Promise<RouteWizardDraftRecord | null> {
  const drafts = await listWizardDrafts();

  if (drafts.length === 0) {
    return null;
  }

  if (jobId) {
    return drafts.find((draft) => draft.jobId === jobId) || null;
  }

  return drafts[0] || null;
}

export async function deleteWizardDraft(jobId: string): Promise<void> {
  const drafts = await readAllDrafts();
  const next = drafts.filter((draft) => draft.jobId !== jobId);

  await writeAllDrafts(next);
}

export async function clearWizardDraft(jobId?: string): Promise<void> {
  if (!jobId) {
    await AsyncStorage.removeItem(STORAGE_KEY_V2);
    await AsyncStorage.removeItem(STORAGE_KEY_V1);
    return;
  }

  await deleteWizardDraft(jobId);
}

export async function hasWizardDraft(): Promise<boolean> {
  const drafts = await listWizardDrafts();

  return drafts.length > 0;
}
