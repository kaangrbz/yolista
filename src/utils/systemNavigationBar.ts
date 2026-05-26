import { NativeModules, Platform } from 'react-native';
import type { AppThemeColors } from '../theme/appThemes';

const { SystemNavigationBar } = NativeModules;

export function applySystemNavigationBar(theme: AppThemeColors): void {
  if (Platform.OS !== 'android' || !SystemNavigationBar?.setStyle) {
    return;
  }

  const lightSystemBars = theme.statusBarStyle === 'dark-content';
  SystemNavigationBar.setStyle(theme.background, lightSystemBars);
}
