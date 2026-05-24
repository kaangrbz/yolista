export const authTheme = {
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
  error: '#DC2626',
  errorBg: '#FEF2F2',
  errorBorder: '#FECACA',
  success: '#16A34A',
  orb1: 'rgba(29, 161, 242, 0.35)',
  orb2: 'rgba(14, 165, 233, 0.25)',
  orb3: 'rgba(56, 189, 248, 0.2)',
  shadow: '#1DA1F2',
} as const;

export type AuthVariant = 'login' | 'register' | 'forgot' | 'reset' | 'verify';

export const authVariantConfig: Record<
  AuthVariant,
  { icon: string; title: string; subtitle: string }
> = {
  login: {
    icon: 'map-marker-path',
    title: 'Tekrar hoş geldin',
    subtitle: 'Rotanı keşfetmeye kaldığın yerden devam et.',
  },
  register: {
    icon: 'compass-outline',
    title: 'Yolculuğa katıl',
    subtitle: 'Rotanı paylaş, yeni yerler keşfet.',
  },
  forgot: {
    icon: 'lock-reset',
    title: 'Şifreni sıfırla',
    subtitle: 'E-postana bir doğrulama kodu göndereceğiz.',
  },
  reset: {
    icon: 'shield-key-outline',
    title: 'Yeni şifre belirle',
    subtitle: 'E-postandaki kodu gir ve güçlü bir şifre oluştur.',
  },
  verify: {
    icon: 'email-check-outline',
    title: 'E-postanı doğrula',
    subtitle: 'Gelen kutundaki 6 haneli kodu gir.',
  },
};
