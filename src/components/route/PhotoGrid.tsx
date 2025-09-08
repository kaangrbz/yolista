import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Photo } from '../../screens/CreateRoute/PhotoSelectionScreen';
import { requestFilePermission } from '../../utils/PermissionController';
import { showToast } from '../../utils/alert';
import { randomString } from '../../utils/randomString';

interface PhotoGridProps {
  selectedPhotos: Photo[];
  onPhotoSelect: (photos: Photo[]) => void;
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

  const handleAddPhoto = async () => {
    try {
      setIsLoading(true);

      // Check permission
      const hasPermission = await requestFilePermission();
      if (!hasPermission) {
        showToast('error', 'Dosya erişim izni reddedildi');
        return;
      }

      // Launch image picker
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: maxPhotos - selectedPhotos.length,
        includeBase64: false,
      });

      if (result.didCancel) return;

      if (result.errorCode) {
        console.error('ImagePicker Error: ', result.errorMessage);
        showToast('error', result.errorMessage || 'Fotoğraf seçilirken bir hata oluştu');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const newPhotos: Photo[] = result.assets.map(asset => ({
          id: randomString(16),
          uri: asset.uri!,
          fileName: asset.fileName,
          type: asset.type,
          fileSize: asset.fileSize,
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

  const renderPhotoItem = (photo: Photo, index: number) => (
    <View key={photo.id} style={styles.photoItem}>
      <Image source={{ uri: photo.uri }} style={styles.photoImage} />
      
      {/* Order number */}
      <View style={styles.orderBadge}>
        <Text style={styles.orderText}>{index + 1}</Text>
      </View>

      {/* Remove button */}
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemovePhoto(photo.id)}>
        <Icon name="close" size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderAddButton = () => (
    <TouchableOpacity
      style={styles.addButton}
      onPress={handleAddPhoto}
      disabled={isLoading || selectedPhotos.length >= maxPhotos}>
      {isLoading ? (
        <ActivityIndicator size="small" color="#666" />
      ) : (
        <>
          <Icon name="plus" size={32} color="#666" />
          <Text style={styles.addButtonText}>
            Fotoğraf Ekle
          </Text>
        </>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.grid}>
        {/* Selected Photos */}
        {selectedPhotos.map((photo, index) => renderPhotoItem(photo, index))}

        {/* Add Button */}
        {selectedPhotos.length < maxPhotos && renderAddButton()}
      </View>

      {/* Info Text */}
      {selectedPhotos.length > 0 && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            💡 Fotoğrafları sürükleyerek sıralayabilirsiniz
          </Text>
        </View>
      )}

      {/* Empty State */}
      {selectedPhotos.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="image-multiple" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Henüz fotoğraf seçmediniz</Text>
          <Text style={styles.emptySubtitle}>
            Rotanız için en az 1, en fazla {maxPhotos} fotoğraf seçebilirsiniz
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
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  },
  addButton: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  addButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    color: '#0066cc',
    fontSize: 14,
    textAlign: 'center',
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
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
});
