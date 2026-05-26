import type { AppThemeId } from './appThemes';

export interface AuthThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  backgroundTop: string;
  backgroundBottom: string;
  card: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  inputBg: string;
  inputBorder: string;
  inputBorderFocus: string;
  inputFocusBg: string;
  error: string;
  errorBg: string;
  errorBorder: string;
  success: string;
  orb1: string;
  orb2: string;
  orb3: string;
  shadow: string;
  backButtonBg: string;
  cardShadow: string;
  buttonDisabled: string;
  buttonText: string;
  statusBarStyle: 'light-content' | 'dark-content';
}

export const AUTH_THEMES: Record<AppThemeId, AuthThemeColors> = {
  light: {
    primary: '#1DA1F2',
    primaryDark: '#0B7BC7',
    primaryLight: '#E8F6FE',
    backgroundTop: '#D6EEFF',
    backgroundBottom: '#FFFFFF',
    card: '#FFFFFF',
    cardBorder: 'rgba(29, 161, 242, 0.12)',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    inputBg: '#F8FAFC',
    inputBorder: '#E2E8F0',
    inputBorderFocus: '#1DA1F2',
    inputFocusBg: '#FFFFFF',
    error: '#DC2626',
    errorBg: '#FEF2F2',
    errorBorder: '#FECACA',
    success: '#16A34A',
    orb1: '#7DD3FC',
    orb2: '#38BDF8',
    orb3: '#BAE6FD',
    shadow: '#1DA1F2',
    backButtonBg: 'rgba(255, 255, 255, 0.85)',
    cardShadow: '#0F172A',
    buttonDisabled: '#CBD5E1',
    buttonText: '#FFFFFF',
    statusBarStyle: 'dark-content',
  },
  dark: {
    primary: '#4dabf7',
    primaryDark: '#2563eb',
    primaryLight: '#1f1f1f',
    backgroundTop: '#1f1f1f',
    backgroundBottom: '#161616',
    card: '#1f1f1f',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    textPrimary: '#f5f5f5',
    textSecondary: '#a3a3a3',
    textMuted: '#8a8a8a',
    inputBg: '#252525',
    inputBorder: '#3a3a3a',
    inputBorderFocus: '#4dabf7',
    inputFocusBg: '#2a2a2a',
    error: '#f87171',
    errorBg: 'rgba(248, 113, 113, 0.12)',
    errorBorder: 'rgba(248, 113, 113, 0.35)',
    success: '#4ade80',
    orb1: '#1a2744',
    orb2: '#122033',
    orb3: '#0f172a',
    shadow: '#000000',
    backButtonBg: 'rgba(22, 22, 22, 0.9)',
    cardShadow: '#000000',
    buttonDisabled: '#3a3a3a',
    buttonText: '#ffffff',
    statusBarStyle: 'light-content',
  },
  night: {
    primary: '#38bdf8',
    primaryDark: '#0284c7',
    primaryLight: '#1a2332',
    backgroundTop: '#1a2332',
    backgroundBottom: '#111827',
    card: '#1a2332',
    cardBorder: 'rgba(148, 163, 184, 0.12)',
    textPrimary: '#cbd5e1',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    inputBg: '#1e293b',
    inputBorder: '#273549',
    inputBorderFocus: '#38bdf8',
    inputFocusBg: '#243044',
    error: '#f87171',
    errorBg: 'rgba(248, 113, 113, 0.1)',
    errorBorder: 'rgba(248, 113, 113, 0.3)',
    success: '#34d399',
    orb1: '#1e3a5f',
    orb2: '#172554',
    orb3: '#0f172a',
    shadow: '#020617',
    backButtonBg: 'rgba(17, 24, 39, 0.92)',
    cardShadow: '#020617',
    buttonDisabled: '#334155',
    buttonText: '#ffffff',
    statusBarStyle: 'light-content',
  },
};

/** @deprecated Use useAuthTheme() instead. */
export const authTheme = AUTH_THEMES.light;
