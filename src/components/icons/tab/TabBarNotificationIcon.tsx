import React from 'react';
import { View, Text } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import { TabBarIcon } from './TabBarIcons';
import type { CurvedStrokeIconProps } from '../CurvedStrokeIcon';

export const TabBarNotificationIcon: React.FC<CurvedStrokeIconProps> = (iconProps) => {
  const { unreadNotificationCount } = useAuth();
  const styles = useThemedStyles((t) => ({
    wrap: {
      position: 'relative',
    },
    badge: {
      position: 'absolute',
      top: -2,
      right: -6,
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

  const hasUnread = unreadNotificationCount !== undefined && unreadNotificationCount > 0;
  const badgeLabel = hasUnread
    ? unreadNotificationCount > 99
      ? '99+'
      : String(unreadNotificationCount)
    : null;

  return (
    <View style={styles.wrap}>
      <TabBarIcon name="notifications" {...iconProps} />
      {badgeLabel !== null && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      )}
    </View>
  );
};
