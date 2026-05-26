import React, { type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/AppThemeContext';

interface ThemedAppShellProps {
  children: ReactNode;
}

/**
 * Fills system inset regions (notch / Dynamic Island / status bar) with the
 * active theme background. Overlays sit behind screen content so they only
 * show through the otherwise empty system chrome areas.
 */
export function ThemedAppShell({ children }: ThemedAppShellProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {insets.top > 0 ? (
        <View
          pointerEvents="none"
          style={[
            styles.insetTop,
            { height: insets.top, backgroundColor: theme.background },
          ]}
        />
      ) : null}
      {Platform.OS === 'ios' && insets.bottom > 0 ? (
        <View
          pointerEvents="none"
          style={[
            styles.insetBottom,
            { height: insets.bottom, backgroundColor: theme.background },
          ]}
        />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  insetTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  insetBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
