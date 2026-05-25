import { useMemo } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { useAppTheme } from '../context/AppThemeContext';
import type { AppThemeColors } from './appThemes';

type NamedStyles<T> = {
  [P in keyof T]: ViewStyle | TextStyle | ImageStyle;
};

export function useThemedStyles<T extends NamedStyles<T>>(
  factory: (theme: AppThemeColors) => T,
): T {
  const theme = useAppTheme();
  return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
}
