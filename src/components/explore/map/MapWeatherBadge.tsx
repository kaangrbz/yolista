import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../context/AppThemeContext';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import { useWeather } from '../../../hooks/useWeather';

interface MapWeatherBadgeProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
}

export const MapWeatherBadge: React.FC<MapWeatherBadgeProps> = ({
  latitude,
  longitude,
}) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
      borderRadius: 12,
      backgroundColor: t.surfaceMuted,
      height: 32,
      minWidth: 52,
    },
    temp: {
      marginLeft: 4,
      fontSize: 13,
      fontWeight: '700',
      color: t.textPrimary,
    },
  }));

  const { weather, loading } = useWeather({ latitude, longitude });

  return (
    <View style={styles.container}>
      {loading && !weather ? (
        <ActivityIndicator size="small" color={theme.textSecondary} />
      ) : weather ? (
        <>
          <Icon name={weather.iconName} size={18} color={theme.accent} />
          <Text style={styles.temp}>{weather.temperatureC}°</Text>
        </>
      ) : null}
    </View>
  );
};

export default MapWeatherBadge;
