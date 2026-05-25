import React from 'react';
import { Text, View } from 'react-native';
import { useThemedStyles } from '../../../theme/useThemedStyles';

interface MapClusterMarkerProps {
  count: number;
}

export const MapClusterMarker: React.FC<MapClusterMarkerProps> = ({ count }) => {
  const styles = useThemedStyles((theme) => ({
    outer: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.overlayDark,
    },
    inner: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.accent,
      borderWidth: 2,
      borderColor: theme.background,
    },
    text: {
      color: theme.background,
      fontWeight: '700',
      fontSize: 14,
    },
  }));

  const size = count > 50 ? 56 : count > 20 ? 48 : count > 10 ? 42 : 36;

  return (
    <View style={[styles.outer, { width: size + 10, height: size + 10, borderRadius: (size + 10) / 2 }]}>
      <View style={[styles.inner, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={styles.text}>{count}</Text>
      </View>
    </View>
  );
};

export default MapClusterMarker;
