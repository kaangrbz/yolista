import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { MAP_ACTIVE_ROUTE_BORDER } from '../../constants/mapDefaults';

interface RouteDetailCTAProps {
  routeId: string;
  stopCountHint?: number | null;
}

export const RouteDetailCTA: React.FC<RouteDetailCTAProps> = ({
  routeId,
  stopCountHint = null,
}) => {
  const navigation = useNavigation<any>();
  const theme = useAppTheme();

  const styles = useThemedStyles((t) => ({
    wrapper: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 48,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: t.surfaceMuted,
      borderWidth: 1,
      borderColor: t.border,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.background,
      borderWidth: 1,
      borderColor: MAP_ACTIVE_ROUTE_BORDER,
    },
    textGroup: {
      flex: 1,
      minWidth: 0,
    },
    label: {
      fontSize: 14,
      fontWeight: '700',
      color: t.textPrimary,
    },
    meta: {
      marginTop: 2,
      fontSize: 12,
      fontWeight: '600',
      color: t.textSecondary,
    },
  }));

  const metaLabel = useMemo(() => {
    if (stopCountHint && stopCountHint > 0) {
      return `${stopCountHint} durak · harita ve rota planı`;
    }

    return 'Harita, duraklar ve rota planı';
  }, [stopCountHint]);

  const handlePress = () => {
    navigation.navigate('RouteDetail', {
      routeId,
      initialTab: 'stops',
    });
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.85}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel="Rotayı aç"
      >
        <View style={styles.iconWrap}>
          <Icon name="map-marker-path" size={18} color={MAP_ACTIVE_ROUTE_BORDER} />
        </View>
        <View style={styles.textGroup}>
          <Text style={styles.label}>Rotayı aç</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {metaLabel}
          </Text>
        </View>
        <Icon name="chevron-right" size={22} color={theme.textMuted} />
      </TouchableOpacity>
    </View>
  );
};

export default RouteDetailCTA;
