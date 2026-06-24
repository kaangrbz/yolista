import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { ROUTE_EXTERNAL_NAV_DISCLAIMER } from '../../constants/routeDetailCopy';

interface RouteDetailFloatingCtaProps {
  onPress: () => void;
}

export const RouteDetailFloatingCta: React.FC<RouteDetailFloatingCtaProps> = ({
  onPress,
}) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const styles = useThemedStyles((t) => ({
    wrapper: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: Math.max(insets.bottom, 12),
      gap: 6,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 50,
      paddingHorizontal: 18,
      paddingVertical: 13,
      borderRadius: 999,
      backgroundColor: theme.accent,
      shadowColor: '#000',
      shadowOpacity: 0.16,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    buttonText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#fff',
    },
    disclaimer: {
      fontSize: 10,
      lineHeight: 14,
      color: t.textMuted,
      textAlign: 'center',
      paddingHorizontal: 8,
    },
  }));

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.88}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Google Maps'te başlat"
      >
        <Icon name="navigation" size={18} color="#fff" />
        <Text style={styles.buttonText}>Google Maps'te başlat</Text>
      </TouchableOpacity>
      <Text style={styles.disclaimer}>{ROUTE_EXTERNAL_NAV_DISCLAIMER}</Text>
    </View>
  );
};

export default RouteDetailFloatingCta;
