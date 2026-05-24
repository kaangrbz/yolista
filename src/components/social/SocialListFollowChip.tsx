import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type SocialListFollowChipProps = {
  isKnown: boolean;
  isLoading: boolean;
  isFollowing: boolean;
  onPress: () => void;
};

export const SocialListFollowChip: React.FC<SocialListFollowChipProps> = ({
  isKnown,
  isLoading,
  isFollowing,
  onPress,
}) => {
  if (!isKnown || isLoading) {
    return (
      <View style={styles.pendingWrap} accessibilityLabel="Takip durumu yükleniyor">
        <ActivityIndicator size="small" color="#121212" />
      </View>
    );
  }

  const label = isFollowing ? 'Takipte' : 'Takip et';

  return (
    <TouchableOpacity
      style={[styles.btn, isFollowing ? styles.btnOutline : styles.btnSolid]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.btnText, isFollowing && styles.btnTextOutline]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pendingWrap: {
    width: 76,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btn: {
    minWidth: 76,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSolid: {
    backgroundColor: '#121212',
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D5DB',
  },
  btnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  btnTextOutline: {
    color: '#374151',
  },
});
