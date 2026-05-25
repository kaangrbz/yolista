import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NoImage } from '../../../assets';

interface ProfileImageUploadProps {
  type: 'profile' | 'header';
  imageUri: string | null;
  uploading: boolean;
  onPress: () => void;
}

/** Profil sayfası banner ile uyumlu kısa şerit (genişlik > yükseklik). */
const HEADER_BANNER_HEIGHT = 160;

const PROFILE_AVATAR_SIZE = 120;

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  type,
  imageUri,
  uploading,
  onPress,
}) => {
  const isHeader = type === 'header';
  const title = isHeader ? 'Kapak Fotoğrafı' : 'Profil Fotoğrafı';
  const iconSize = isHeader ? 32 : 24;
  const a11yLabel = isHeader ? 'Kapak fotoğrafı seç veya değiştir' : 'Profil fotoğrafı seç veya değiştir';
  const useBannerLayout = isHeader;

  return (
    <View style={[styles.container, useBannerLayout && styles.bannerOuter]}>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity
        style={[
          useBannerLayout ? styles.bannerTouchable : styles.profileImageTouchable,
          useBannerLayout && styles.headerBannerContainer,
        ]}
        onPress={onPress}
        disabled={uploading}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
      >
        {uploading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1DA1F2" />
          </View>
        ) : (
          <>
            {isHeader && !imageUri ? (
              <View style={styles.headerImage} />
            ) : (
              <Image
                source={imageUri ? { uri: imageUri } : NoImage}
                style={[
                  !useBannerLayout && styles.profileImage,
                  isHeader && styles.headerImage,
                ]}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
            )}
            <View style={styles.overlay}>
              <View style={styles.iconContainer}>
                <Icon name="camera" size={iconSize} color="#fff" />
              </View>
            </View>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  bannerOuter: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  profileImageTouchable: {
    position: 'relative',
    alignSelf: 'center',
    width: PROFILE_AVATAR_SIZE,
    height: PROFILE_AVATAR_SIZE,
    borderRadius: PROFILE_AVATAR_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: PROFILE_AVATAR_SIZE / 2,
  },
  bannerTouchable: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#667eea',
  },
  headerBannerContainer: {
    width: '100%',
    height: HEADER_BANNER_HEIGHT,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});

export default ProfileImageUpload;
