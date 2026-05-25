import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme, useAppThemeControl } from '../../context/AppThemeContext';
import {
  APP_THEME_IDS,
  APP_THEME_LABELS,
  type AppThemeId,
} from '../../theme/appThemes';

export function AppThemeToggle() {
  const theme = useAppTheme();
  const { themeId, setThemeId } = useAppThemeControl();

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: theme.border,
          backgroundColor: theme.surfaceMuted,
        },
      ]}
      accessibilityRole="radiogroup"
      accessibilityLabel="Tema seçimi"
    >
      {APP_THEME_IDS.map((id) => {
        const selected = themeId === id;
        return (
          <TouchableOpacity
            key={id}
            style={[
              styles.option,
              selected && {
                backgroundColor: theme.background,
              },
            ]}
            onPress={() => setThemeId(id as AppThemeId)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={APP_THEME_LABELS[id]}
          >
            <Text
              style={[
                styles.optionLabel,
                { color: selected ? theme.textPrimary : theme.textMuted },
              ]}
            >
              {APP_THEME_LABELS[id]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
