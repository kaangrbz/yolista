import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { MAP_ACTIVE_ROUTE_BORDER } from '../../constants/mapDefaults';

export type RouteDetailHeroMode = 'photos' | 'map';

interface RouteDetailHeroToggleProps {
  mode: RouteDetailHeroMode;
  onModeChange: (mode: RouteDetailHeroMode) => void;
}

export const RouteDetailHeroToggle: React.FC<RouteDetailHeroToggleProps> = ({
  mode,
  onModeChange,
}) => {
  const theme = useAppTheme();

  const styles = useThemedStyles((t) => ({
    row: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 4,
      marginBottom: 8,
      padding: 3,
      borderRadius: 12,
      backgroundColor: t.surfaceMuted,
      gap: 4,
    },
    option: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
      borderRadius: 9,
    },
    optionActive: {
      backgroundColor: t.background,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    optionText: {
      fontSize: 13,
      fontWeight: '600',
      color: t.textSecondary,
    },
    optionTextActive: {
      color: MAP_ACTIVE_ROUTE_BORDER,
      fontWeight: '700',
    },
  }));

  const options: { id: RouteDetailHeroMode; label: string; icon: string }[] = [
    { id: 'photos', label: 'Fotoğraflar', icon: 'image-multiple-outline' },
    { id: 'map', label: 'Önizleme', icon: 'map-outline' },
  ];

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const isActive = mode === option.id;

        return (
          <TouchableOpacity
            key={option.id}
            style={[styles.option, isActive && styles.optionActive]}
            activeOpacity={0.85}
            onPress={() => onModeChange(option.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Icon
              name={option.icon}
              size={16}
              color={isActive ? MAP_ACTIVE_ROUTE_BORDER : theme.textSecondary}
            />
            <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default RouteDetailHeroToggle;
