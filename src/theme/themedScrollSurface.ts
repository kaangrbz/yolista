import type { ViewStyle } from 'react-native';
import type { AppThemeColors } from './appThemes';

export interface ThemedScrollSurfaceStyles {
  style: ViewStyle;
  contentContainerStyle: ViewStyle;
}

/**
 * ScrollView / FlatList arka planını tema rengine boyar.
 * iOS overscroll (bounce) ve Android varsayılan beyaz scroll alanını önler.
 */
export function themedScrollSurface(theme: AppThemeColors): ThemedScrollSurfaceStyles {
  return {
    style: {
      flex: 1,
      backgroundColor: theme.background,
    },
    contentContainerStyle: {
      flexGrow: 1,
      backgroundColor: theme.background,
    },
  };
}
