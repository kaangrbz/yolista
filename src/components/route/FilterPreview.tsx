import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Photo } from '../../screens/CreateRoute/PhotoSelectionScreen';

interface FilterPreviewProps {
  photos: Photo[];
  selectedFilter: string;
}

const { width: screenWidth } = Dimensions.get('window');
const previewSize = (screenWidth - 60) / 3; // 3 photos per row with margins

export const FilterPreview: React.FC<FilterPreviewProps> = ({
  photos,
  selectedFilter,
}) => {
  const getFilterStyle = (filterId: string) => {
    // Demo filter styles - in real implementation, these would be actual image filters
    switch (filterId) {
      case 'vintage':
        return {
          tintColor: '#d4a574',
          opacity: 0.8,
        };
      case 'bw':
        return {
          // Black and white would be handled by actual image processing
        };
      case 'sepia':
        return {
          tintColor: '#704214',
          opacity: 0.7,
        };
      case 'bright':
        return {
          // Brightness would be handled by actual image processing
        };
      case 'contrast':
        return {
          // Contrast would be handled by actual image processing
        };
      default:
        return {};
    }
  };

  const renderPhotoPreview = (photo: Photo, index: number) => (
    <View key={photo.id} style={styles.previewItem}>
      <Image
        source={{ uri: photo.uri }}
        style={[styles.previewImage, getFilterStyle(selectedFilter)]}
      />
      <View style={styles.previewOverlay}>
        <Text style={styles.previewNumber}>{index + 1}</Text>
      </View>
      {selectedFilter !== 'none' && (
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>DEMO</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Önizleme</Text>
        <Text style={styles.subtitle}>
          {selectedFilter === 'none' 
            ? 'Orijinal fotoğraflar' 
            : `${selectedFilter} filtresi uygulandı`}
        </Text>
      </View>

      {photos.length > 0 ? (
        <ScrollView
          style={styles.previewContainer}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled>
          <View style={styles.previewGrid}>
            {photos.slice(0, 9).map((photo, index) => 
              renderPhotoPreview(photo, index)
            )}
          </View>
          
          {photos.length > 9 && (
            <View style={styles.morePhotosIndicator}>
              <Text style={styles.morePhotosText}>
                +{photos.length - 9} fotoğraf daha
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyPreview}>
          <Text style={styles.emptyText}>Önizlenecek fotoğraf yok</Text>
        </View>
      )}

      {selectedFilter !== 'none' && (
        <View style={styles.demoNotice}>
          <Text style={styles.demoNoticeText}>
            💡 Bu sadece bir demo önizlemedir. Gerçek filtreler geliştirme aşamasındadır.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  previewContainer: {
    maxHeight: 400,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  previewItem: {
    width: previewSize,
    height: previewSize,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewOverlay: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewNumber: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ff9800',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '600',
  },
  morePhotosIndicator: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  morePhotosText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  emptyPreview: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  demoNotice: {
    marginTop: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  demoNoticeText: {
    fontSize: 12,
    color: '#1976d2',
    lineHeight: 16,
    textAlign: 'center',
  },
});
