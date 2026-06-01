import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import type { ProfileBadge } from '../../model/profile.model';
import { PROFILE_BADGE_ASSETS, pickPrimaryBadges } from '../../lib/profileBadges';
import { showProfileBadgeSheet } from './ProfileBadgeSheetHost';

interface ProfileBadgesProps {
  badges: ProfileBadge[];
  size?: number;
  maxVisible?: number;
}

const ProfileBadgeIcon: React.FC<{ badge: ProfileBadge; size: number }> = ({
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

  return (
    <MaterialIcons
      name={badge.icon_value}
      size={size}
      color={badge.color}
    />
  );
};

const ProfileBadges: React.FC<ProfileBadgesProps> = ({
  badges,
  size = 18,
  maxVisible,
}) => {
  if (!badges || badges.length === 0) {
    return null;
  }

  const visible =
    typeof maxVisible === 'number'
      ? pickPrimaryBadges(badges, maxVisible)
      : badges;

  return (
    <View style={styles.badgeRow}>
      {visible.map((badge) => (
        <TouchableOpacity
          key={badge.key}
          onPress={() => showProfileBadgeSheet(badge)}
          style={styles.badgeButton}
          accessibilityRole="button"
          accessibilityLabel={`${badge.label} rozet bilgisi`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ProfileBadgeIcon badge={badge} size={size} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 4,
  },
  badgeButton: {
    padding: 2,
  },
});

export default ProfileBadges;
