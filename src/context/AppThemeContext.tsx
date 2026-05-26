import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState, Platform, StatusBar } from 'react-native';
import {
  APP_THEMES,
  isAppThemeId,
  type AppThemeColors,
  type AppThemeId,
} from '../theme/appThemes';
import { AUTH_THEMES, type AuthThemeColors } from '../theme/authThemes';
import { applySystemNavigationBar } from '../utils/systemNavigationBar';
import { ThemedAppShell } from '../components/common/ThemedAppShell';

const STORAGE_KEY = 'yolista-app-theme';

interface AppThemeContextValue {
  theme: AppThemeColors;
  themeId: AppThemeId;
  setThemeId: (id: AppThemeId) => void;
  ready: boolean;
}

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function useAppTheme(): AppThemeColors {
  const ctx = useContext(AppThemeContext);
  if (!ctx) {
    return APP_THEMES.light;
  }
  return ctx.theme;
}

export function useAuthTheme(): AuthThemeColors {
  const ctx = useContext(AppThemeContext);
  const themeId = ctx?.themeId ?? 'light';
  return AUTH_THEMES[themeId];
}

export function useAppThemeControl(): AppThemeContextValue {
  const ctx = useContext(AppThemeContext);
  if (!ctx) {
    throw new Error('useAppThemeControl must be used within AppThemeProvider');
  }
  return ctx;
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<AppThemeId>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && isAppThemeId(stored)) {
          setThemeIdState(stored);
        }
      } catch {
        // ignore read errors
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setThemeId = useCallback(async (next: AppThemeId) => {
    setThemeIdState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore write errors
    }
  }, []);

  const theme = APP_THEMES[themeId];

  useEffect(() => {
    if (!ready) {
      return;
    }

    applySystemNavigationBar(theme);
  }, [theme, ready]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        applySystemNavigationBar(theme);
      }
    });

    return () => subscription.remove();
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      themeId,
      setThemeId,
      ready,
    }),
    [theme, themeId, setThemeId, ready],
  );

  return (
    <AppThemeContext.Provider value={value}>
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
        translucent={false}
      />
      <ThemedAppShell>{children}</ThemedAppShell>
    </AppThemeContext.Provider>
  );
}
