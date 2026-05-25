import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { NotificationBellIcon } from '../icons/NotificationBellIcon';

interface NotificationBellButtonProps {
  onPress: () => void;
  count?: number;
}

export const NotificationBellButton: React.FC<NotificationBellButtonProps> = ({
  onPress,
  count,
}) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    hit: {
      padding: 8,
      position: 'relative',
    },
    badge: {
      position: 'absolute',
      top: 4,
      right: 4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: '#FF3B30',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      borderWidth: 1.5,
      borderColor: t.background,
    },
    badgeText: {
      color: t.background,
      fontSize: 10,
      fontWeight: '700',
      lineHeight: 12,
    },
  }));

  const hasUnread = count !== undefined && count > 0;
  const badgeLabel = hasUnread ? (count > 99 ? '99+' : String(count)) : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.hit}
      accessibilityRole="button"
      accessibilityLabel="Bildirimler"
    >
      <NotificationBellIcon size={24} color={theme.textPrimary} />
      {badgeLabel !== null && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
