import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CreateFlowPhoto } from '../../types/createRouteFlowTypes';
import { RouteStop } from '../../screens/CreateRoute/StopDetailsScreen';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';

interface StopPhotoStripProps {
  photos: CreateFlowPhoto[];
  stops: RouteStop[];
  activeIndex: number | null;
  onSelect: (index: number) => void;
}

export const StopPhotoStrip: React.FC<StopPhotoStripProps> = ({
  photos,
  stops,
  activeIndex,
  onSelect,
}) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    container: {
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    scrollContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    item: {
      width: 56,
      height: 56,
      borderRadius: 10,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'transparent',
      backgroundColor: t.surfaceMuted,
      position: 'relative',
    },
    itemActive: {
      borderColor: t.accent,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    badge: {
      position: 'absolute',
      bottom: 3,
      right: 3,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: t.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    indexLabel: {
      position: 'absolute',
      top: 3,
      left: 3,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 4,
      backgroundColor: t.overlayDark,
      alignItems: 'center',
      justifyContent: 'center',
    },
    indexText: {
      color: t.onMedia,
      fontSize: 9,
      fontWeight: '700',
    },
  }));

  const stopByPhotoId = new Map(stops.map((stop) => [stop.photoId, stop]));

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {photos.map((photo, index) => {
          const stop = stopByPhotoId.get(photo.id);
          const hasLocation = !!stop?.coordinate;

          return (
            <TouchableOpacity
              key={photo.id}
              style={[styles.item, activeIndex !== null && index === activeIndex && styles.itemActive]}
              onPress={() => onSelect(index)}
              activeOpacity={0.85}
            >
              <Image
                source={{ uri: photo.processedLocalUri || photo.uri }}
                style={styles.image}
              />

              <View style={styles.indexLabel}>
                <Text style={styles.indexText}>{index + 1}</Text>
              </View>

              {hasLocation ? (
                <View style={styles.badge}>
                  <Icon name="check" size={10} color={theme.background} />
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default StopPhotoStrip;
