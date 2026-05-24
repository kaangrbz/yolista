import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { appTheme } from '../../../theme/appTheme';

interface MapClusterMarkerProps {
  count: number;
}

export const MapClusterMarker: React.FC<MapClusterMarkerProps> = ({ count }) => {
  const size = count > 50 ? 56 : count > 20 ? 48 : count > 10 ? 42 : 36;

  return (
    <View style={[styles.outer, { width: size + 10, height: size + 10, borderRadius: (size + 10) / 2 }]}>
      <View style={[styles.inner, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={styles.text}>{count}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 18, 18, 0.2)',
  },
  inner: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appTheme.accent,
    borderWidth: 2,
    borderColor: '#fff',
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default MapClusterMarker;
