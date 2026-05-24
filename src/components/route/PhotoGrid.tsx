import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  PanResponder,
  Pressable,
  LayoutChangeEvent,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { CreateFlowPhoto } from '../../types/createRouteFlowTypes';
import { requestPhotos } from '../../permissions';
import { showToast } from '../../utils/alert';
import { randomString } from '../../utils/randomString';
import { appTheme } from '../../theme/appTheme';
import { useNestedScrollDragLock } from '../../hooks/useNestedScrollDragLock';
import { clampIndex, reorderList } from '../../utils/reorderList';

type PickerPhotoInput = Omit<CreateFlowPhoto, 'uploadStatus'>;

const NUM_COLUMNS = 2;
const ITEM_MARGIN_BOTTOM = 16;
const LONG_PRESS_DRAG_MS = 220;

interface PhotoGridProps {
  selectedPhotos: CreateFlowPhoto[];
  onPhotoSelect: (photos: PickerPhotoInput[]) => void;
  onPhotoReorder: (fromIndex: number, toIndex: number) => void;
  onRemovePhoto: (photoId: string) => void;
  maxPhotos: number;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  selectedPhotos,
  onPhotoSelect,
  onPhotoReorder,
  onRemovePhoto,
  maxPhotos,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const dragOffsetX = useRef(new Animated.Value(0)).current;
  const dragOffsetY = useRef(new Animated.Value(0)).current;
  const draggingIndexRef = useRef<number | null>(null);
  const photosRef = useRef(selectedPhotos);
  const columnWidthRef = useRef(0);
  const rowStrideRef = useRef(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDragIndexRef = useRef<number | null>(null);
  const isDragInteractionActiveRef = useRef(false);

  const { scrollEnabled, setDragInteractionActive } = useNestedScrollDragLock({
    reenableDelayMs: 1000,
  });

  useEffect(() => {
    photosRef.current = selectedPhotos;
  }, [selectedPhotos]);

  const notifyDragInteraction = (isActive: boolean) => {
    if (isDragInteractionActiveRef.current === isActive) {
      return;
    }

    isDragInteractionActiveRef.current = isActive;
    setDragInteractionActive(isActive);
  };

  const setDragging = (index: number | null) => {
    draggingIndexRef.current = index;
    setDraggingIndex(index);
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    pendingDragIndexRef.current = null;
  };

  const finishDrag = (translationX: number, translationY: number) => {
    const fromIndex = draggingIndexRef.current;

    if (fromIndex === null) {
      notifyDragInteraction(false);

      return;
    }

    const currentPhotos = photosRef.current;
    const columnWidth = columnWidthRef.current;
    const rowStride = rowStrideRef.current;

    if (columnWidth <= 0 || rowStride <= 0) {
      dragOffsetX.setValue(0);
      dragOffsetY.setValue(0);
      setDragging(null);
      notifyDragInteraction(false);

      return;
    }

    const colShift = Math.round(translationX / columnWidth);
    const rowShift = Math.round(translationY / rowStride);
    const indexShift = rowShift * NUM_COLUMNS + colShift;
    const toIndex = clampIndex(fromIndex + indexShift, currentPhotos.length);

    if (toIndex !== fromIndex) {
      onPhotoReorder(fromIndex, toIndex);
    }

    dragOffsetX.setValue(0);
    dragOffsetY.setValue(0);
    setDragging(null);
    notifyDragInteraction(false);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => draggingIndexRef.current !== null,
      onMoveShouldSetPanResponderCapture: () => draggingIndexRef.current !== null,
      onPanResponderTerminationRequest: () => draggingIndexRef.current === null,
      onPanResponderMove: (_, gestureState) => {
        dragOffsetX.setValue(gestureState.dx);
        dragOffsetY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        finishDrag(gestureState.dx, gestureState.dy);
      },
      onPanResponderTerminate: (_, gestureState) => {
        finishDrag(gestureState.dx, gestureState.dy);
      },
    }),
  ).current;

  const handlePhotoLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;

    if (width > 0) {
      columnWidthRef.current = width;
    }

    if (height > 0) {
      rowStrideRef.current = height + ITEM_MARGIN_BOTTOM;
    }
  };

  const handlePhotoPressIn = (index: number) => {
    if (selectedPhotos.length <= 1) {
      return;
    }

    pendingDragIndexRef.current = index;
    notifyDragInteraction(true);
    clearLongPressTimer();

    longPressTimerRef.current = setTimeout(() => {
      if (pendingDragIndexRef.current === index) {
        setDragging(index);
      }
    }, LONG_PRESS_DRAG_MS);
  };

  const handlePhotoPressOut = () => {
    if (draggingIndexRef.current === null) {
      clearLongPressTimer();
      notifyDragInteraction(false);
    }
  };

  useEffect(() => {
    return () => {
      clearLongPressTimer();
      setDragInteractionActive(false);
    };
  }, [setDragInteractionActive]);

  const handleAddPhoto = async () => {
    try {
      setIsLoading(true);

      const hasPermission = await requestPhotos();

      if (!hasPermission) {
        showToast('error', 'Dosya erişim izni reddedildi');

        return;
      }

      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: maxPhotos - selectedPhotos.length,
        includeBase64: false,
        assetRepresentationMode: 'compatible',
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        console.error('ImagePicker Error: ', result.errorMessage);
        showToast('error', result.errorMessage || 'Fotoğraf seçilirken bir hata oluştu');

        return;
      }

      if (result.assets && result.assets.length > 0) {
        const newPhotos: PickerPhotoInput[] = result.assets.map((asset) => ({
          id: randomString(16),
          uri: asset.uri!,
          fileName: asset.fileName,
          type: asset.type,
          fileSize: asset.fileSize,
          width: asset.width,
          height: asset.height,
        }));

        const updatedPhotos = [...selectedPhotos, ...newPhotos];
        onPhotoSelect(updatedPhotos);
      }
    } catch (error) {
      console.error('Error selecting photos:', error);
      showToast('error', 'Fotoğraf seçilirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    Alert.alert(
      'Fotoğrafı Sil',
      'Bu fotoğrafı silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => onRemovePhoto(photoId),
        },
      ],
    );
  };

  const renderUploadBadge = (photo: CreateFlowPhoto) => {
    if (photo.uploadStatus === 'done') {
      return (
        <View style={[styles.uploadBadge, styles.uploadBadgeDone]}>
          <Icon name="check" size={14} color="#fff" />
        </View>
      );
    }

    if (photo.uploadStatus === 'failed') {
      return (
        <View style={[styles.uploadBadge, styles.uploadBadgeFailed]}>
          <Icon name="alert-circle-outline" size={14} color="#fff" />
        </View>
      );
    }

    if (
      photo.uploadStatus === 'processing' ||
      photo.uploadStatus === 'uploading' ||
      photo.uploadStatus === 'pending'
    ) {
      return (
        <View style={[styles.uploadBadge, styles.uploadBadgePending]}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      );
    }

    return null;
  };

  const canReorder = selectedPhotos.length > 1;

  const renderPhotoItem = (photo: CreateFlowPhoto, index: number) => {
    const displayUri = photo.processedLocalUri || photo.uri;
    const isDragging = draggingIndex === index;

    const photoItemStyle = isDragging
      ? [
          styles.photoItem,
          styles.photoItemDragging,
          {
            transform: [
              { translateX: dragOffsetX },
              { translateY: dragOffsetY },
            ],
          },
        ]
      : styles.photoItem;

    return (
      <Animated.View
        key={photo.id}
        style={photoItemStyle}
        onLayout={index === 0 ? handlePhotoLayout : undefined}
      >
        <Pressable
          style={styles.photoPressable}
          onPressIn={() => handlePhotoPressIn(index)}
          onPressOut={handlePhotoPressOut}
          disabled={!canReorder}
          accessibilityLabel="Sıralamak için basılı tut"
        >
          <Image source={{ uri: displayUri }} style={styles.photoImage} />

          <View style={styles.orderBadge}>
            <Text style={styles.orderText}>{index + 1}</Text>
          </View>

          {renderUploadBadge(photo)}

          {canReorder ? (
            <View style={styles.dragHintBadge}>
              <Icon name="drag" size={14} color="#fff" />
            </View>
          ) : null}
        </Pressable>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemovePhoto(photo.id)}
        >
          <Icon name="close" size={16} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderAddButton = () => (
    <TouchableOpacity
      style={styles.addButton}
      onPress={handleAddPhoto}
      disabled={isLoading || selectedPhotos.length >= maxPhotos}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={appTheme.textSecondary} />
      ) : (
        <>
          <Icon name="plus" size={32} color={appTheme.textSecondary} />
          <Text style={styles.addButtonText}>
            Fotoğraf Ekle
          </Text>
        </>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      scrollEnabled={scrollEnabled}
      keyboardShouldPersistTaps="handled"
    >
      <View {...panResponder.panHandlers}>
        <View style={styles.grid}>
          {selectedPhotos.map((photo, index) => renderPhotoItem(photo, index))}

          {selectedPhotos.length < maxPhotos && renderAddButton()}
        </View>
      </View>

      {selectedPhotos.length > 0 && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            {canReorder
              ? 'Sırayı değiştirmek için fotoğrafa basılı tutup sürükleyin.'
              : 'En az iki fotoğraf eklediğinde sıralama yapabilirsin.'}
          </Text>
        </View>
      )}

      {selectedPhotos.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="image-multiple" size={64} color={appTheme.borderStrong} />
          <Text style={styles.emptyTitle}>Henüz fotoğraf yok</Text>
          <Text style={styles.emptySubtitle}>
            En az 1, en fazla {maxPhotos} fotoğraf ekleyebilirsin
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  photoItem: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: ITEM_MARGIN_BOTTOM,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoItemDragging: {
    zIndex: 20,
    elevation: 10,
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  photoPressable: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  orderBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  dragHintBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 10,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  uploadBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBadgeDone: {
    backgroundColor: 'rgba(34, 139, 34, 0.9)',
  },
  uploadBadgeFailed: {
    backgroundColor: 'rgba(220, 53, 69, 0.9)',
  },
  uploadBadgePending: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  addButton: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: ITEM_MARGIN_BOTTOM,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: appTheme.borderStrong,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appTheme.surfaceMuted,
  },
  addButtonText: {
    color: appTheme.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: appTheme.surfaceMuted,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: appTheme.border,
  },
  infoText: {
    color: appTheme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: appTheme.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: appTheme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
});
