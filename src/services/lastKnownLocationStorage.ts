import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LatLng } from '../utils/routeDistance';

const STORAGE_KEY = '@yolista/last_known_location_v1';
const SAVE_DEBOUNCE_MS = 500;

type StoredLocation = LatLng & {
  savedAt: number;
};

let memoryCache: LatLng | null = null;
let hydratePromise: Promise<LatLng | null> | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSave: LatLng | null = null;

const isValidCoordinate = (value: unknown): value is LatLng => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const { latitude, longitude } = value as LatLng;

  return (
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude)
  );
};

export const getLastKnownLocationSync = (): LatLng | null => memoryCache;

export const hydrateLastKnownLocation = async (): Promise<LatLng | null> => {
  if (memoryCache) {
    return memoryCache;
  }

  if (hydratePromise) {
    return hydratePromise;
  }

  hydratePromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as StoredLocation;

      if (!isValidCoordinate(parsed)) {
        return null;
      }

      memoryCache = {
        latitude: parsed.latitude,
        longitude: parsed.longitude,
      };

      return memoryCache;
    } catch (err) {
      console.warn('lastKnownLocation hydrate failed:', err);
      return null;
    } finally {
      hydratePromise = null;
    }
  })();

  return hydratePromise;
};

export const saveLastKnownLocation = (coordinate: LatLng): void => {
  if (!isValidCoordinate(coordinate)) {
    return;
  }

  memoryCache = coordinate;
  pendingSave = coordinate;

  if (saveTimer) {
    clearTimeout(saveTimer);
  }

  saveTimer = setTimeout(() => {
    const toSave = pendingSave;
    pendingSave = null;
    saveTimer = null;

    if (!toSave) {
      return;
    }

    const entry: StoredLocation = {
      latitude: toSave.latitude,
      longitude: toSave.longitude,
      savedAt: Date.now(),
    };

    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entry)).catch((err) => {
      console.warn('lastKnownLocation save failed:', err);
    });
  }, SAVE_DEBOUNCE_MS);
};
