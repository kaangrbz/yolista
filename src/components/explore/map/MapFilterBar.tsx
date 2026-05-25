import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CategoryItem } from '../../../types/category.types';
import { MAP_FILTER_DISTANCE_OPTIONS_KM } from '../../../constants/mapDefaults';
import { useAppTheme } from '../../../context/AppThemeContext';
import { useThemedStyles } from '../../../theme/useThemedStyles';

export interface MapFilters {
  categoryId: number;
  maxDistanceKm: number | null;
  nearMe: boolean;
}

interface MapFilterBarProps {
  categories: CategoryItem[];
  filters: MapFilters;
  onFiltersChange: (next: MapFilters) => void;
}

const Chip: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
  iconName?: string;
}> = ({ label, active, onPress, iconName }) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.background,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 6,
      borderWidth: 1,
      borderColor: t.border,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    chipActive: {
      backgroundColor: t.accent,
      borderColor: t.accent,
    },
    chipIcon: {
      marginRight: 4,
    },
    chipText: {
      fontSize: 12,
      color: t.textSecondary,
      fontWeight: '500',
    },
    chipTextActive: {
      color: t.background,
    },
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.chip, active && styles.chipActive]}
    >
      {iconName ? (
        <Icon
          name={iconName}
          size={14}
          color={active ? theme.background : theme.textSecondary}
          style={styles.chipIcon}
        />
      ) : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export const MapFilterBar: React.FC<MapFilterBarProps> = ({
  categories,
  filters,
  onFiltersChange,
}) => {
  const styles = useThemedStyles((t) => ({
    container: {
      width: '100%',
    },
    scrollContent: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      alignItems: 'center',
    },
    divider: {
      width: 1,
      height: 18,
      backgroundColor: t.borderStrong,
      marginHorizontal: 8,
    },
  }));

  const handleCategoryPress = (categoryId: number) => {
    onFiltersChange({ ...filters, categoryId });
  };

  const handleDistancePress = (distanceKm: number) => {
    const nextDistance = filters.maxDistanceKm === distanceKm ? null : distanceKm;

    onFiltersChange({ ...filters, maxDistanceKm: nextDistance });
  };

  const handleNearMeToggle = () => {
    onFiltersChange({ ...filters, nearMe: !filters.nearMe });
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Chip
          label="Etrafımdakiler"
          iconName="crosshairs-gps"
          active={filters.nearMe}
          onPress={handleNearMeToggle}
        />

        {MAP_FILTER_DISTANCE_OPTIONS_KM.map((distance) => (
          <Chip
            key={`distance-${distance}`}
            label={`${distance} km`}
            active={filters.maxDistanceKm === distance}
            onPress={() => handleDistancePress(distance)}
          />
        ))}

        <View style={styles.divider} />

        {categories.map((category) => (
          <Chip
            key={`category-${category.id}`}
            label={category.name}
            iconName={category.icon_name}
            active={filters.categoryId === category.id}
            onPress={() => handleCategoryPress(category.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default MapFilterBar;
