import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ProfileEmailVerificationProps {
  email?: string;
  isEmailConfirmed: boolean;
  onVerifyPress: () => void;
  variant?: 'compact';
}

const ProfileEmailVerification: React.FC<ProfileEmailVerificationProps> = ({
  email,
  isEmailConfirmed,
  onVerifyPress,
  variant = 'compact',
}) => {
  if (!email) {
    return null;
  }

  const isCompact = variant === 'compact';

  if (isEmailConfirmed) {
    return (
      <View style={[styles.confirmedCard, isCompact && styles.confirmedCardCompact]}>
        <Icon name="email-check-outline" size={18} color="#16A34A" />
        <Text style={styles.confirmedText}>
          E-posta adresin doğrulandı.
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.pendingCard, isCompact && styles.pendingCardCompact]}
      onPress={onVerifyPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="E-postayı doğrula"
    >
      <Icon name="email-alert-outline" size={20} color="#1DA1F2" />
      <View style={styles.pendingTextBlock}>
        <Text style={styles.pendingTitle}>E-postanı doğrula</Text>
        <Text style={styles.pendingSubtitle} numberOfLines={2}>
          Doğrulama kodu veya bağlantısı için devam et.
        </Text>
      </View>
      <Icon name="chevron-right" size={20} color="#1DA1F2" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  confirmedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  confirmedCardCompact: {
    marginTop: 8,
  },
  confirmedText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#E8F6FE',
    borderWidth: 1,
    borderColor: 'rgba(29, 161, 242, 0.25)',
  },
  pendingCardCompact: {
    marginTop: 8,
  },
  pendingTextBlock: {
    flex: 1,
  },
  pendingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  pendingSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
});

export default ProfileEmailVerification;
