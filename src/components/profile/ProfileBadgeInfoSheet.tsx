import React from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import type { ProfileBadge } from '../../model/profile.model';
import { PROFILE_BADGE_ASSETS } from '../../lib/profileBadges';

interface ProfileBadgeInfoSheetProps {
  visible: boolean;
  badge: ProfileBadge | null;
  onClose: () => void;
}

const SheetIcon: React.FC<{ badge: ProfileBadge; size: number }> = ({
  badge,
  size,
}) => {
  if (badge.icon_type === 'asset_key') {
    const asset = PROFILE_BADGE_ASSETS[badge.icon_value];
    if (asset) {
      return (
        <Image
          source={asset.source}
          style={{
            width: size,
            height: size,
            tintColor: asset.tintColor ?? badge.color,
          }}
          resizeMode="contain"
        />
      );
    }
  }
  if (badge.icon_type === 'svg_url') {
    return (
      <Image
        source={{ uri: badge.icon_value }}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    );
  }
  return <MaterialIcons name={badge.icon_value} size={size} color={badge.color} />;
};

const ProfileBadgeInfoSheet: React.FC<ProfileBadgeInfoSheetProps> = ({
  visible,
  badge,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  if (!badge) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="Kapat"
        />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.iconWrap}>
            <SheetIcon badge={badge} size={28} />
          </View>
          <Text style={styles.title}>{badge.label}</Text>
          <Text style={styles.message}>{badge.description}</Text>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: badge.color }]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Tamam"
          >
            <Text style={styles.closeButtonText}>Tamam</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    alignSelf: 'stretch',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  closeButton: {
    alignSelf: 'stretch',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ProfileBadgeInfoSheet;
