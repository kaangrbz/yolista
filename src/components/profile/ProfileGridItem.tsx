import React from 'react';
import { TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { RouteWithProfile } from '../../model/routes.model';
import CachedImage from '../common/CachedImage';
import { usePostImageDownload } from '../../hooks/useImageDownload';

const { width } = Dimensions.get('window');

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
    >
      <CachedImage
        source={imageUri ? { uri: imageUri } : { uri: 'https://via.placeholder.com/400x400/f0f0f0/999?text=No+Image' }}
        style={styles.gridImage}
        resizeMode="cover"
        showRetryButton={false}
        fallbackSource={{ uri: 'https://via.placeholder.com/400x400/f0f0f0/999?text=No+Image' }}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gridItem: {
    width: width / 3,
    height: width / 3,
    borderWidth: 0.5,
    borderColor: '#fff',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
});

export default ProfileGridItem;
