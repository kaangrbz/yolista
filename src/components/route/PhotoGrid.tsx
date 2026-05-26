import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { showConfirm } from '../common/ConfirmModal';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { CreateFlowPhoto } from '../../types/createRouteFlowTypes';
import { requestPhotos } from '../../permissions';
import { showToast } from '../../utils/alert';
import { randomString } from '../../utils/randomString';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';
import ImageViewer from '../ImageViewer';

type PickerPhotoInput = Omit<CreateFlowPhoto, 'uploadStatus'>;

const NUM_COLUMNS = 2;
const ITEM_MARGIN_BOTTOM = 16;

interface PhotoGridProps {
  selectedPhotos: CreateFlowPhoto[];
  onPhotoSelect: (photos: PickerPhotoInput[]) => void;
  onRemovePhoto: (photoId: string) => void;
  maxPhotos: number;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  selectedPhotos,
  onPhotoSelect,
  onRemovePhoto,
  maxPhotos,
}) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
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
      backgroundColor: t.surfaceMuted,
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
      backgroundColor: t.overlayDark,
      borderRadius: 12,
      minWidth: 24,
      height: 24,
      paddingHorizontal: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    orderText: {
      color: t.onMedia,
      fontSize: 12,
      fontWeight: '700',
    },
    removeButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: 'rgba(220, 53, 69, 0.9)',
      borderRadius: 12,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2,
    },
    addButton: {
      width: '48%',
      aspectRatio: 1,
      marginBottom: ITEM_MARGIN_BOTTOM,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: t.borderStrong,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: t.surfaceMuted,
    },
    addButtonText: {
      color: t.textSecondary,
      fontSize: 14,
      fontWeight: '500',
      marginTop: 8,
      textAlign: 'center',
    },
    infoContainer: {
      backgroundColor: t.surfaceMuted,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: t.border,
    },
    infoText: {
      color: t.textSecondary,
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 19,
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
      color: t.textPrimary,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: t.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: 40,
    },
  }));

  const [isLoading, setIsLoading] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const viewerImages = useMemo(
    () =>
      selectedPhotos.map((p) => ({
        uri: p.processedLocalUri || p.uri,
      })),
    [selectedPhotos],
  );

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerVisible(true);
  };

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
        assetRepresentationMode: 'current',
      });

      if (result.didCancel) return;

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

        onPhotoSelect([...selectedPhotos, ...newPhotos]);
      }
    } catch (error) {
      console.error('Error selecting photos:', error);
      showToast('error', 'Fotoğraf seçilirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    showConfirm({
      title: 'Fotoğrafı Sil',
      message: 'Bu fotoğrafı silmek istediğinizden emin misiniz?',
      icon: 'trash-can-outline',
      iconColor: '#dc2626',
      actions: [
        { key: 'cancel', label: 'İptal', variant: 'ghost' },
        { key: 'delete', label: 'Sil', variant: 'destructive', onPress: () => onRemovePhoto(photoId) },
      ],
    });
  };

  const renderPhotoItem = (photo: CreateFlowPhoto, index: number) => {
    const displayUri = photo.processedLocalUri || photo.uri;

    return (
      <View key={photo.id} style={styles.photoItem}>
        <TouchableOpacity
          style={styles.photoPressable}
          activeOpacity={0.85}
          onPress={() => openViewer(index)}>
          <Image source={{ uri: displayUri }} style={styles.photoImage} />

          <View style={styles.orderBadge}>
            <Text style={styles.orderText}>{index + 1}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemovePhoto(photo.id)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Icon name="close" size={16} color={theme.onMedia} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderAddButton = () => (
    <TouchableOpacity
      style={styles.addButton}
      onPress={handleAddPhoto}
      disabled={isLoading || selectedPhotos.length >= maxPhotos}>
      {isLoading ? (
        <ActivityIndicator size="small" color={theme.textSecondary} />
      ) : (
        <>
          <Icon name="plus" size={32} color={theme.textSecondary} />
          <Text style={styles.addButtonText}>Fotoğraf Ekle</Text>
        </>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      <View style={styles.grid}>
        {selectedPhotos.map((photo, index) => renderPhotoItem(photo, index))}

        {selectedPhotos.length < maxPhotos && renderAddButton()}
      </View>

      {selectedPhotos.length > 0 ? (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Tam ekran görmek için fotoğrafa dokun. Sıralamayı bir sonraki adımda düzenleyebilirsin.
          </Text>
        </View>
      ) : null}

      {selectedPhotos.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="image-multiple" size={64} color={theme.borderStrong} />
          <Text style={styles.emptyTitle}>Henüz fotoğraf yok</Text>
          <Text style={styles.emptySubtitle}>
            En az 1, en fazla {maxPhotos} fotoğraf ekleyebilirsin
          </Text>
        </View>
      ) : null}

      <ImageViewer
        images={viewerImages}
        visible={viewerVisible}
        initialIndex={viewerIndex}
        onRequestClose={() => setViewerVisible(false)}
      />
    </ScrollView>
  );
};
