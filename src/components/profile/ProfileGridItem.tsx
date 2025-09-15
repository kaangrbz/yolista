import React from 'react';
import { TouchableOpacity, StyleSheet, Dimensions, View } from 'react-native';
import { RouteWithProfile } from '../../model/routes.model';
import CachedImage from '../common/CachedImage';
import { usePostImageDownload } from '../../hooks/useImageDownload';

const { width } = Dimensions.get('window');
const itemSize = (width - 4) / 3; // Consistent sizing with skeleton

interface ProfileGridItemProps {
  item: RouteWithProfile;
  index: number;
  onRoutePress: (routeId: string) => void;
}

const ProfileGridItem: React.FC<ProfileGridItemProps> = ({ item, index, onRoutePress }) => {
  const { imageUri, loading, error } = usePostImageDownload(item.image_url, item.user_id || '');

  return (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => onRoutePress(item.id || '')}
      activeOpacity={0.8}
    >
      <CachedImage
        source={imageUri ? { uri: imageUri } : { uri: 'https://via.placeholder.com/400x400/f0f0f0/999?text=No+Image' }}
        style={styles.gridImage}
        resizeMode="cover"
        showRetryButton={false}
        fallbackSource={{ uri: 'https://via.placeholder.com/400x400/f0f0f0/999?text=No+Image' }}
      />

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingIndicator} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gridItem: {
    width: itemSize,
    height: itemSize,
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: '#f5f5f5',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIndicator: {
    width: 20,
    height: 20,
    backgroundColor: '#ddd',
    borderRadius: 10,
  },
});

export default ProfileGridItem;
