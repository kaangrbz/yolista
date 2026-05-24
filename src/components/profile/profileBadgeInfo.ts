export type ProfileBadgeKind = 'verified' | 'email_verified';

export interface ProfileBadgeInfoContent {
  title: string;
  message: string;
  iconName: 'verified' | 'mark-email-read';
  iconColor: string;
}

export const PROFILE_BADGE_INFO: Record<ProfileBadgeKind, ProfileBadgeInfoContent> = {
  verified: {
    title: 'Doğrulanmış hesap',
    message:
      'Bu hesap Yolista tarafından incelenmiş ve doğrulanmıştır. Güvenilir içerik üreticisi veya resmi hesap statüsüne sahiptir.',
    iconName: 'verified',
    iconColor: '#1DA1F2',
  },
  email_verified: {
    title: 'E-posta doğrulandı',
    message:
      'E-posta adresin doğrulanmıştır. Giriş güvenliği, hesap kurtarma ve önemli bildirimler bu adrese gönderilir.',
    iconName: 'mark-email-read',
    iconColor: '#16A34A',
  },
};
