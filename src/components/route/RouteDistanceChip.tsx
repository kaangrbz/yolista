import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';
import {
  getRouteDistanceLabel,
  type LatLngLike,
} from '../../utils/routeDistance';

interface RouteDistanceChipProps {
  points: LatLngLike[];
  prefix?: string;
}

export const RouteDistanceChip: React.FC<RouteDistanceChipProps> = ({
  points,
  prefix = 'Toplam',
}) => {
  const theme = useAppTheme();

  const distanceLabel = useMemo(
    () => getRouteDistanceLabel(points),
    [points],
  );

  const styles = useThemedStyles((t) => ({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: t.surfaceMuted,
      borderWidth: 1,
      borderColor: t.border,
    },
    text: {
      marginLeft: 6,
      fontSize: 12,
      fontWeight: '700',
      color: t.textSecondary,
    },
  }));

  if (!distanceLabel) {
    return null;
  }

  return (
    <View style={styles.chip}>
      <Icon name="map-marker-distance" size={14} color={theme.textSecondary} />
      <Text style={styles.text}>
        {prefix} {distanceLabel}
      </Text>
    </View>
  );
};

export default RouteDistanceChip;
