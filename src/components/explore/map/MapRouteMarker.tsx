import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { appTheme } from '../../../theme/appTheme';

interface MapRouteMarkerProps {
  iconName?: string;
  selected?: boolean;
  label?: string;
}

export const MapRouteMarker: React.FC<MapRouteMarkerProps> = ({
  iconName = 'map-marker',
  selected = false,
  label,
}) => {
  return (
    <View style={styles.wrapper}>
      <View style={[styles.pin, selected && styles.pinSelected]}>
        <Icon
          name={iconName}
          size={selected ? 20 : 16}
          color={selected ? '#fff' : appTheme.textPrimary}
        />
      </View>

      {label ? (
        <View style={styles.labelWrapper}>
          <Text numberOfLines={1} style={styles.labelText}>
            {label}
          </Text>
        </View>
      ) : null}

      <View style={[styles.tail, selected && styles.tailSelected]} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: appTheme.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  pinSelected: {
    backgroundColor: appTheme.accent,
    transform: [{ scale: 1.15 }],
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: appTheme.accent,
    marginTop: -2,
  },
  tailSelected: {
    borderTopColor: appTheme.accent,
  },
  labelWrapper: {
    position: 'absolute',
    top: -22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    maxWidth: 120,
  },
  labelText: {
    fontSize: 10,
    color: appTheme.textPrimary,
    fontWeight: '600',
  },
});

export default MapRouteMarker;
