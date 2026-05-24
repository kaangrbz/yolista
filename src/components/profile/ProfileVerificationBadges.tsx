import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ProfileBadgeInfoSheet from './ProfileBadgeInfoSheet';
import { ProfileBadgeKind } from './profileBadgeInfo';

interface ProfileVerificationBadgesProps {
  isVerified: boolean;
  isEmailConfirmed?: boolean;
  showEmailBadge?: boolean;
}

const ProfileVerificationBadges: React.FC<ProfileVerificationBadgesProps> = ({
  isVerified,
  isEmailConfirmed = false,
  showEmailBadge = false,
}) => {
  const [activeBadge, setActiveBadge] = useState<ProfileBadgeKind | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const showGreenEmailBadge = showEmailBadge && isEmailConfirmed && !isVerified;

  if (!isVerified && !showGreenEmailBadge) {
    return null;
  }

  const openSheet = (kind: ProfileBadgeKind) => {
    setActiveBadge(kind);
    setSheetVisible(true);
  };

  const closeSheet = () => {
    setSheetVisible(false);
    setActiveBadge(null);
  };

  return (
    <>
      <View style={styles.badgeRow}>
        {isVerified ? (
          <TouchableOpacity
            onPress={() => openSheet('verified')}
            style={styles.badgeButton}
            accessibilityRole="button"
            accessibilityLabel="Doğrulanmış hesap bilgisi"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="verified" size={18} color="#1DA1F2" />
          </TouchableOpacity>
        ) : null}

        {showGreenEmailBadge ? (
          <TouchableOpacity
            onPress={() => openSheet('email_verified')}
            style={styles.badgeButton}
            accessibilityRole="button"
            accessibilityLabel="E-posta doğrulandı bilgisi"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="mark-email-read" size={18} color="#16A34A" />
          </TouchableOpacity>
        ) : null}
      </View>

      <ProfileBadgeInfoSheet
        visible={sheetVisible}
        badgeKind={activeBadge}
        onClose={closeSheet}
      />
    </>
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

export default ProfileVerificationBadges;
