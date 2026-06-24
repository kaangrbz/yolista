import React from 'react';
import { TouchableOpacity, Dimensions } from 'react-native';
import { RouteWithProfile } from '../../model/routes.model';
import SmartImage from '../common/smart-image/SmartImage';
import { useThemedStyles } from '../../theme/useThemedStyles';

const { width } = Dimensions.get('window');
const itemSize = (width - 4) / 3;

interface ProfileGridItemProps {
  item: RouteWithProfile;
  index: number;
  onRoutePress: (routeId: string) => void;
}

const ProfileGridItem: React.FC<ProfileGridItemProps> = ({ item, onRoutePress }) => {
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
  }));

  return (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => onRoutePress(item.id || '')}
      activeOpacity={0.8}
    >
      <SmartImage
        kind="route"
        userId={item.user_id || ''}
        imageUrl={item.image_url}
        imagePreviewUrl={item.image_preview_url}
        width={itemSize}
        height={itemSize}
        style={styles.gridImage}
      />
    </TouchableOpacity>
  );
};

export default ProfileGridItem;
