import React, { useCallback, useMemo } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { CreateFlowPhoto } from '../../types/createRouteFlowTypes';
import { getStopPhotoHintLabel } from '../../utils/getStopPhotoHintLabel';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';

interface StopReorderItem {
  key: string;
  photo: CreateFlowPhoto;
  index: number;
}

interface StopReorderListProps {
  photos: CreateFlowPhoto[];
  stopTitles?: string[];
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export const StopReorderList: React.FC<StopReorderListProps> = ({
  photos,
  stopTitles = [],
  onReorder,
}) => {
  const theme = useAppTheme();

  const data = useMemo(
    (): StopReorderItem[] =>
      photos.map((photo, index) => ({
        key: photo.id,
        photo,
        index,
      })),
    [photos],
  );

  const styles = useThemedStyles((t) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 4,
      backgroundColor: t.background,
    },
    rowActive: {
      backgroundColor: t.surfaceMuted,
      borderRadius: 12,
    },
    thumb: {
      width: 52,
      height: 52,
      borderRadius: 10,
      backgroundColor: t.surfaceMuted,
    },
    meta: {
      flex: 1,
      marginLeft: 12,
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: t.textPrimary,
    },
    subtitle: {
      fontSize: 12,
      color: t.textSecondary,
      marginTop: 2,
    },
    dragHandle: {
      padding: 8,
    },
  }));

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<StopReorderItem>) => {
      const label = getStopPhotoHintLabel({
        title: stopTitles[item.index],
        order_index: item.index,
      });

      return (
      <ScaleDecorator>
        <View style={[styles.row, isActive && styles.rowActive]}>
          <Image
            source={{ uri: item.photo.processedLocalUri || item.photo.uri }}
            style={styles.thumb}
          />
          <View style={styles.meta}>
            {label ? (
              <Text style={styles.title} numberOfLines={2}>
                {label}
              </Text>
            ) : null}
            <Text style={styles.subtitle} numberOfLines={1}>
              Sürükleyerek sırayı değiştir
            </Text>
          </View>
          <TouchableOpacity
            style={styles.dragHandle}
            onLongPress={drag}
            delayLongPress={120}
          >
            <Icon name="drag-horizontal-variant" size={22} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </ScaleDecorator>
      );
    },
    [stopTitles, styles, theme.textMuted],
  );

  return (
    <DraggableFlatList
      data={data}
      keyExtractor={(item) => item.key}
      renderItem={renderItem}
      onDragEnd={({ from, to }) => {
        if (from !== to) {
          onReorder(from, to);
        }
      }}
      activationDistance={12}
    />
  );
};

export default StopReorderList;
