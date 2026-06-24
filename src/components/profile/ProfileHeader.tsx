import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SmartImage from '../common/smart-image/SmartImage';
import { useThemedStyles } from '../../theme/useThemedStyles';
import ProfileHeaderSkeleton from './ProfileHeaderSkeleton';

const DEFAULT_HEADER_BACKGROUND = '#667eea';

interface ProfileHeaderProps {
  headerImageUri: string | null;
  headerImageUrl?: string | null;
  headerImagePreviewUrl?: string | null;
  isCurrentUserProfile: boolean;
  onHeaderImagePress: () => void;
  onSettingsPress: () => void;
  onSharePress?: () => void;
  userId?: string;
  loading?: boolean;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  headerImageUri,
  headerImageUrl,
  headerImagePreviewUrl,
  isCurrentUserProfile,
  onHeaderImagePress,
  onSettingsPress,
  onSharePress,
  userId,
  loading = false,
}) => {
  const styles = useThemedStyles((t) => ({
    headerContainer: {
      position: 'relative',
      height: 200,
    },
    headerTouchable: {
      width: '100%',
      height: '100%',
    },
    headerImage: {
      width: '100%',
      height: '100%',
    },
    headerPlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: DEFAULT_HEADER_BACKGROUND,
    },
    actionButtons: {
      position: 'absolute',
      top: 16,
      right: 16,
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      backgroundColor: t.overlayDark,
      padding: 8,
      borderRadius: 20,
    },
  }));

  if (loading) {
    return <ProfileHeaderSkeleton />;
  }

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        onPress={onHeaderImagePress}
        disabled={!headerImageUri}
        style={styles.headerTouchable}
      >
        {headerImageUri || headerImageUrl ? (
          <SmartImage
            kind="header"
            userId={userId || ''}
            imageUrl={headerImageUrl || undefined}
            imagePreviewUrl={headerImagePreviewUrl || undefined}
            resolvedUri={headerImageUri || undefined}
          style={[styles.headerImage, { width: '100%', height: 200 }]}
          />
        ) : (
          <View style={styles.headerPlaceholder} />
        )}
      </TouchableOpacity>

      <View style={styles.actionButtons}>
        {onSharePress ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onSharePress}
            accessibilityLabel="Profili paylaş"
          >
            <Icon name="share-variant" size={22} color="#fff" />
          </TouchableOpacity>
        ) : null}
        {isCurrentUserProfile ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onSettingsPress}
            accessibilityLabel="Ayarlar"
          >
            <Icon name="cog-outline" size={22} color="#fff" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

export default ProfileHeader;
