import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';

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
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
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
      backgroundColor: t.textPrimary,
    },
    btnOutline: {
      backgroundColor: 'transparent',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.borderStrong,
    },
    btnText: {
      fontSize: 12,
      fontWeight: '600',
      color: t.background,
    },
    btnTextOutline: {
      color: t.textPrimary,
    },
  }));

  if (!isKnown || isLoading) {
    return (
      <View style={styles.pendingWrap} accessibilityLabel="Takip durumu yükleniyor">
        <ActivityIndicator size="small" color={theme.textPrimary} />
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
