import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../context/AppThemeContext';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import { MAP_ACTIVE_ROUTE_BORDER } from '../../../constants/mapDefaults';

interface MapRouteDetailButtonProps {
  onPress: () => void;
  onExpandSheet?: () => void;
}

export const MapRouteDetailButton: React.FC<MapRouteDetailButtonProps> = ({
  onPress,
  onExpandSheet,
}) => {
  const theme = useAppTheme();

  const styles = useThemedStyles((t) => ({
    wrapper: {
      paddingHorizontal: 18,
      paddingTop: 6,
      paddingBottom: 6,
      gap: 8,
    },
    row: {
      flexDirection: 'row',
      gap: 8,
    },
    button: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 44,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: t.background,
      borderWidth: 1,
      borderColor: MAP_ACTIVE_ROUTE_BORDER,
    },
    expandButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      minHeight: 44,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: t.surfaceMuted,
      borderWidth: 1,
      borderColor: t.border,
    },
    label: {
      fontSize: 13,
      fontWeight: '700',
      color: MAP_ACTIVE_ROUTE_BORDER,
    },
    expandLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: t.textPrimary,
    },
    hint: {
      fontSize: 11,
      lineHeight: 15,
      color: t.textMuted,
      textAlign: 'center',
    },
  }));

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {onExpandSheet ? (
          <TouchableOpacity
            style={styles.expandButton}
            activeOpacity={0.85}
            onPress={onExpandSheet}
            accessibilityRole="button"
            accessibilityLabel="Önizlemeyi büyüt"
          >
            <Icon name="arrow-expand" size={18} color={theme.textPrimary} />
            <Text style={styles.expandLabel}>Büyüt</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.85}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel="Tam detay"
        >
          <Icon name="arrow-top-right" size={18} color={MAP_ACTIVE_ROUTE_BORDER} />
          <Text style={styles.label}>Tam detay</Text>
        </TouchableOpacity>
      </View>

      {onExpandSheet ? (
        <Text style={styles.hint}>
          Haritada kalıp büyütebilir veya tam detay sayfasını açabilirsiniz.
        </Text>
      ) : null}
    </View>
  );
};

export default MapRouteDetailButton;
