import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomTabBar, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useThemedStyles } from '../theme/useThemedStyles';

/**
 * Sadece üst çizgi / arka plan sarmalayıcı.
 * Yükseklik ve alt boşluk React Navigation tarafından (safe area ile) yönetilir;
 * manuel height + paddingBottom çift boşluk oluşturuyordu.
 */
export const AppTabBar = (props: BottomTabBarProps) => {
  const styles = useThemedStyles((theme) => ({
    outer: {
      backgroundColor: theme.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.hairlineBorder,
    },
  }));

  return (
    <View style={styles.outer}>
      <BottomTabBar {...props} />
    </View>
  );
};
