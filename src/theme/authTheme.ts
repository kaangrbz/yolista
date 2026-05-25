import { AUTH_MOBILE } from '../shared/auth-messages';

export type { AuthThemeColors } from './authThemes';
export { authTheme, AUTH_THEMES } from './authThemes';

export type AuthVariant = 'login' | 'register' | 'forgot' | 'reset' | 'verify';

export const loginReturningCopy = {
  title: AUTH_MOBILE.login.returningTitle,
  subtitle: AUTH_MOBILE.login.returningSubtitle,
} as const;

export const authVariantConfig: Record<
  AuthVariant,
  { icon: string; title: string; subtitle: string }
> = {
  login: {
    icon: 'map-marker-path',
    title: AUTH_MOBILE.login.title,
    subtitle: AUTH_MOBILE.login.subtitle,
  },
  register: {
    icon: 'compass-outline',
    title: AUTH_MOBILE.register.title,
    subtitle: AUTH_MOBILE.register.subtitle,
  },
  forgot: {
    icon: 'lock-reset',
    title: AUTH_MOBILE.forgot.title,
    subtitle: AUTH_MOBILE.forgot.subtitle,
  },
  reset: {
    icon: 'shield-key-outline',
    title: AUTH_MOBILE.reset.title,
    subtitle: AUTH_MOBILE.reset.subtitle,
  },
  verify: {
    icon: 'email-check-outline',
    title: AUTH_MOBILE.verify.title,
    subtitle: AUTH_MOBILE.verify.subtitle,
  },
};
