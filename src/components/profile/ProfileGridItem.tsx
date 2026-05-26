import React from 'react';
import { TouchableOpacity, Dimensions, View } from 'react-native';
import { RouteWithProfile } from '../../model/routes.model';
import CachedImage from '../common/CachedImage';
import { usePostImageDownload } from '../../hooks/useImageDownload';
import { useThemedStyles } from '../../theme/useThemedStyles';

const { width } = Dimensions.get('window');
const itemSize = (width - 4) / 3;

interface ProfileGridItemProps {
  item: RouteWithProfile;
  index: number;
  onRoutePress: (routeId: string) => void;
}

const ProfileGridItem: React.FC<ProfileGridItemProps> = ({ item, index, onRoutePress }) => {
  const styles = useThemedStyles((t) => ({
    gridItem: {
      width: itemSize,
      height: itemSize,
      borderWidth: 1,
      borderColor: t.background,
      backgroundColor: t.surfaceMuted,
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
      backgroundColor: t.overlayDark,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingIndicator: {
      width: 20,
      height: 20,
      backgroundColor: t.borderStrong,
      borderRadius: 10,
    },
  }));

  const { imageUri, loading } = usePostImageDownload(item.image_url, item.user_id || '');

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

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingIndicator} />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default ProfileGridItem;
