import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CategoryItem } from '../../../types/category.types';
import { MAP_FILTER_DISTANCE_OPTIONS_KM } from '../../../constants/mapDefaults';
import { appTheme } from '../../../theme/appTheme';

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
          color={active ? '#fff' : appTheme.textSecondary}
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

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: appTheme.border,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  chipActive: {
    backgroundColor: appTheme.accent,
    borderColor: appTheme.accent,
  },
  chipIcon: {
    marginRight: 4,
  },
  chipText: {
    fontSize: 12,
    color: appTheme.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: appTheme.borderStrong,
    marginHorizontal: 8,
  },
});

export default MapFilterBar;
