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

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  type,
  imageUri,
  uploading,
  onPress,
}) => {
  const isHeader = type === 'header';
  const title = isHeader ? 'Kapak Fotoğrafı' : 'Profil Fotoğrafı';
  const iconSize = isHeader ? 32 : 24;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity
        style={[styles.imageContainer, isHeader && styles.headerContainer]}
        onPress={onPress}
        disabled={uploading}
        activeOpacity={0.8}
      >
        {uploading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1DA1F2" />
            <Text style={styles.loadingText}>Yükleniyor...</Text>
          </View>
        ) : (
          <>
            <Image
              source={imageUri ? { uri: imageUri } : NoImage}
              style={[styles.image, isHeader && styles.headerImage]}
              resizeMode={isHeader ? "cover" : "contain"}
            />
            <View style={styles.overlay}>
              <View style={styles.iconContainer}>
                <Icon name="camera" size={iconSize} color="#fff" />
              </View>
              <Text style={styles.overlayText}>
                {isHeader ? 'Kapak fotoğrafı değiştir' : 'Profil fotoğrafı değiştir'}
              </Text>
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
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  headerContainer: {
    width: '100%',
    height: 400,
  },
  image: {
    height: 400,
    width: '100%',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
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
    marginBottom: 8,
  },
  overlayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default ProfileImageUpload;
