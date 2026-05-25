import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { CategoryItem } from '../types/category.types';

const STORAGE_KEY = '@yolista/categories_cache_v1';
const TTL_MS = 1000 * 60 * 60 * 24; // 24 saat sonra arka planda yenile

type CacheEntry = {
  data: CategoryItem[];
  savedAt: number;
};

let memoryCache: CategoryItem[] | null = null;
let inflight: Promise<CategoryItem[]> | null = null;
let hydrated = false;

async function hydrateFromStorage(): Promise<CategoryItem[] | null> {
  if (memoryCache) return memoryCache;

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

    if (!raw) {
      hydrated = true;
      return null;
    }

    const parsed = JSON.parse(raw) as CacheEntry;

    if (Array.isArray(parsed?.data) && parsed.data.length > 0) {
      memoryCache = parsed.data;
      hydrated = true;
      return parsed.data;
    }
  } catch (err) {
    console.warn('categoriesCache hydrate failed:', err);
  }

  hydrated = true;
  return null;
}

async function fetchFromNetwork(): Promise<CategoryItem[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('index', { ascending: true })
    .limit(999);

  if (error) {
    throw error;
  }

  const list = (data || []) as CategoryItem[];

  memoryCache = list;

  try {
    const entry: CacheEntry = { data: list, savedAt: Date.now() };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch (err) {
    console.warn('categoriesCache persist failed:', err);
  }

  return list;
}

function refreshInBackground(): void {
  if (inflight) return;

  inflight = fetchFromNetwork()
    .catch((err) => {
      console.warn('categoriesCache background refresh failed:', err);
      return memoryCache || [];
    })
    .finally(() => {
      inflight = null;
    }) as Promise<CategoryItem[]>;
}

/**
 * Kategorileri stale-while-revalidate stratejisi ile döner.
 * - Bellekte veya AsyncStorage'da varsa anında döner; aynı anda ağ üzerinden tazeler.
 * - Cache yoksa ağ çağrısı bekler.
 */
export async function getCachedCategories(): Promise<CategoryItem[]> {
  if (memoryCache && memoryCache.length > 0) {
    refreshInBackground();
    return memoryCache;
  }

  if (!hydrated) {
    const stored = await hydrateFromStorage();

    if (stored && stored.length > 0) {
      refreshInBackground();
      return stored;
    }
  }

  if (inflight) {
    return inflight;
  }

  inflight = fetchFromNetwork().finally(() => {
    inflight = null;
  });

  return inflight;
}

/** Cache'i zorla geçersiz kıl ve yeniden çek. */
export async function refreshCategoriesCache(): Promise<CategoryItem[]> {
  inflight = fetchFromNetwork().finally(() => {
    inflight = null;
  });
  return inflight;
}

/** Test/debug için cache temizleme. */
export async function clearCategoriesCache(): Promise<void> {
  memoryCache = null;
  hydrated = false;
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // yoksay
  }
}

export { TTL_MS };
