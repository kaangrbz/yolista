/**
 * Semantic theme tokens for mobile UI.
 * Rules and web mapping: docs/THEME_COLORS.md
 */
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
  /** Icons, links, map highlights — not filled primary buttons */
  accent: string;
  accentPositive: string;
  /** Filled primary CTA (Devam, Yayınla) */
  buttonPrimaryBg: string;
  buttonPrimaryText: string;
  /** Outline / secondary CTA (Atla, Taslaklar outline) */
  buttonSecondaryBg: string;
  buttonSecondaryText: string;
  buttonSecondaryBorder: string;
  /** Selected chips / preview tags */
  chipSelectedBg: string;
  chipSelectedText: string;
  /** Photo carousel / viewer chrome */
  mediaBackdrop: string;
  onMedia: string;
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
    buttonPrimaryBg: '#121212',
    buttonPrimaryText: '#ffffff',
    buttonSecondaryBg: '#f8f9fa',
    buttonSecondaryText: '#666666',
    buttonSecondaryBorder: '#e0e0e0',
    chipSelectedBg: '#121212',
    chipSelectedText: '#ffffff',
    mediaBackdrop: '#0a0a0a',
    onMedia: '#ffffff',
    overlayDark: 'rgba(0, 0, 0, 0.55)',
    hairlineBorder: 'rgba(0, 0, 0, 0.08)',
    statusBarStyle: 'dark-content',
  },
  dark: {
    id: 'dark',
    background: '#161616',
    surfaceMuted: '#1f1f1f',
    border: '#2b2b2b',
    borderStrong: '#3a3a3a',
    textPrimary: '#f5f5f5',
    textSecondary: '#a3a3a3',
    textMuted: '#8a8a8a',
    accent: '#4dabf7',
    accentPositive: '#4ade80',
    buttonPrimaryBg: '#2563eb',
    buttonPrimaryText: '#ffffff',
    buttonSecondaryBg: '#1f1f1f',
    buttonSecondaryText: '#a3a3a3',
    buttonSecondaryBorder: '#3a3a3a',
    chipSelectedBg: '#2563eb',
    chipSelectedText: '#ffffff',
    mediaBackdrop: '#0a0a0a',
    onMedia: '#ffffff',
    overlayDark: 'rgba(0, 0, 0, 0.72)',
    hairlineBorder: 'rgba(255, 255, 255, 0.08)',
    statusBarStyle: 'light-content',
  },
  night: {
    id: 'night',
    background: '#111827',
    surfaceMuted: '#1a2332',
    border: '#273549',
    borderStrong: '#3d5168',
    textPrimary: '#cbd5e1',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    accent: '#38bdf8',
    accentPositive: '#34d399',
    buttonPrimaryBg: '#0284c7',
    buttonPrimaryText: '#ffffff',
    buttonSecondaryBg: '#1a2332',
    buttonSecondaryText: '#94a3b8',
    buttonSecondaryBorder: '#3d5168',
    chipSelectedBg: '#0284c7',
    chipSelectedText: '#ffffff',
    mediaBackdrop: '#0a0a0a',
    onMedia: '#ffffff',
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
