export type AppThemeId = 'light' | 'dark' | 'night';

export interface AppThemeColors {
  id: AppThemeId;
  background: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentPositive: string;
  overlayDark: string;
  hairlineBorder: string;
  statusBarStyle: 'light-content' | 'dark-content';
}

export const APP_THEME_LABELS: Record<AppThemeId, string> = {
  light: 'Açık',
  dark: 'Koyu',
  night: 'Gece',
};

export const APP_THEMES: Record<AppThemeId, AppThemeColors> = {
  light: {
    id: 'light',
    background: '#ffffff',
    surfaceMuted: '#f8f9fa',
    border: '#f0f0f0',
    borderStrong: '#e0e0e0',
    textPrimary: '#121212',
    textSecondary: '#666666',
    textMuted: '#999999',
    accent: '#121212',
    accentPositive: '#4CAF50',
    overlayDark: 'rgba(0, 0, 0, 0.55)',
    hairlineBorder: 'rgba(0, 0, 0, 0.08)',
    statusBarStyle: 'dark-content',
  },
  dark: {
    id: 'dark',
    background: '#000000',
    surfaceMuted: '#0a0a0a',
    border: '#1a1a1a',
    borderStrong: '#2a2a2a',
    textPrimary: '#f5f5f5',
    textSecondary: '#a3a3a3',
    textMuted: '#8a8a8a',
    accent: '#f5f5f5',
    accentPositive: '#4ade80',
    overlayDark: 'rgba(0, 0, 0, 0.72)',
    hairlineBorder: 'rgba(255, 255, 255, 0.08)',
    statusBarStyle: 'light-content',
  },
  night: {
    id: 'night',
    background: '#060a12',
    surfaceMuted: '#0c1220',
    border: '#1e293b',
    borderStrong: '#334155',
    textPrimary: '#cbd5e1',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    accent: '#cbd5e1',
    accentPositive: '#34d399',
    overlayDark: 'rgba(0, 0, 0, 0.65)',
    hairlineBorder: 'rgba(148, 163, 184, 0.12)',
    statusBarStyle: 'light-content',
  },
};

export const APP_THEME_IDS: AppThemeId[] = ['light', 'dark', 'night'];

export function isAppThemeId(value: string | null | undefined): value is AppThemeId {
  return value === 'light' || value === 'dark' || value === 'night';
}

/** @deprecated Use useAppTheme() from AppThemeContext instead. */
export const appTheme = APP_THEMES.light;
