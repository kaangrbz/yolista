import { useMemo } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { useAuthTheme } from '../context/AppThemeContext';
import type { AuthThemeColors } from './authThemes';

type NamedStyles<T> = {
  [P in keyof T]: ViewStyle | TextStyle | ImageStyle;
};

export function useAuthThemedStyles<T extends NamedStyles<T>>(
  factory: (theme: AuthThemeColors) => T,
): T {
  const theme = useAuthTheme();
  return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
}
