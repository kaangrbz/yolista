import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BottomTabBar, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { appTheme } from '../theme/appTheme';

/**
 * Sadece üst çizgi / arka plan sarmalayıcı.
 * Yükseklik ve alt boşluk React Navigation tarafından (safe area ile) yönetilir;
 * manuel height + paddingBottom çift boşluk oluşturuyordu.
 */
export const AppTabBar = (props: BottomTabBarProps) => {
  return (
    <View style={styles.outer}>
      <BottomTabBar {...props} />
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    backgroundColor: appTheme.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
});
