import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteWithProfile } from '../../../model/routes.model';
import { appTheme } from '../../../theme/appTheme';

interface MapRouteListItemProps {
  route: RouteWithProfile;
  selected?: boolean;
  onPress: () => void;
  variant?: 'horizontal' | 'vertical';
}

export const MapRouteListItem: React.FC<MapRouteListItemProps> = ({
  route,
  selected = false,
  onPress,
  variant = 'vertical',
}) => {
  const isHorizontal = variant === 'horizontal';

  const containerStyle = isHorizontal
    ? styles.horizontalContainer
    : styles.verticalContainer;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[containerStyle, selected && styles.selected]}
    >
      <View style={isHorizontal ? styles.imageWrapperHorizontal : styles.imageWrapperVertical}>
        {route.image_url ? (
          <Image source={{ uri: route.image_url }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Icon name="image-off-outline" size={24} color={appTheme.textMuted} />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.title}>
          {route.title}
        </Text>

        {route.cities?.name ? (
          <View style={styles.metaRow}>
            <Icon name="map-marker" size={12} color={appTheme.textSecondary} />
            <Text numberOfLines={1} style={styles.metaText}>
              {route.cities.name}
            </Text>
          </View>
        ) : null}

        <View style={styles.metaRow}>
          <Icon name="heart-outline" size={12} color={appTheme.textSecondary} />
          <Text style={styles.metaText}>{route.like_count || 0}</Text>

          {route.categories?.name ? (
            <>
              <View style={styles.dot} />
              <Text numberOfLines={1} style={styles.metaText}>
                {route.categories.name}
              </Text>
            </>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  verticalContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 4,
    padding: 8,
    borderWidth: 1,
    borderColor: appTheme.border,
  },
  horizontalContainer: {
    width: 260,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: appTheme.border,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  selected: {
    borderColor: appTheme.accent,
    borderWidth: 2,
  },
  imageWrapperVertical: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 10,
  },
  imageWrapperHorizontal: {
    width: 84,
    height: 84,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: appTheme.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: appTheme.textPrimary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
    color: appTheme.textSecondary,
    marginLeft: 4,
    flexShrink: 1,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: appTheme.textMuted,
    marginHorizontal: 6,
  },
});

export default MapRouteListItem;
