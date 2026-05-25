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
import { DefaultAvatar } from '../../../assets';

const COVER_HEIGHT = 148;
const AVATAR_SIZE = 104;
const AVATAR_OVERLAP = 52;
const DEFAULT_COVER_COLOR = '#667eea';

interface ProfileEditMediaHeroProps {
  headerImageUri: string | null;
  profileImageUri: string | null;
  uploadingHeader: boolean;
  uploadingProfile: boolean;
  onPickHeader: () => void;
  onPickProfile: () => void;
}

const ProfileEditMediaHero: React.FC<ProfileEditMediaHeroProps> = ({
  headerImageUri,
  profileImageUri,
  uploadingHeader,
  uploadingProfile,
  onPickHeader,
  onPickProfile,
}) => {
  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.coverTouchable}
        onPress={onPickHeader}
        disabled={uploadingHeader}
        activeOpacity={0.92}
        accessibilityRole="button"
        accessibilityLabel="Kapak fotoğrafını değiştir"
      >
        {headerImageUri ? (
          <Image
            source={{ uri: headerImageUri }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.coverPlaceholder} />
        )}

        <View style={styles.coverScrimBottom} />

        {uploadingHeader ? (
          <View style={styles.coverLoading}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        ) : (
          <View style={styles.coverAction}>
            <Icon name="image-edit-outline" size={16} color="#fff" />
            <Text style={styles.coverActionText}>Kapak</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.avatarRow}>
        <TouchableOpacity
          style={styles.avatarTouchable}
          onPress={onPickProfile}
          disabled={uploadingProfile}
          activeOpacity={0.92}
          accessibilityRole="button"
          accessibilityLabel="Profil fotoğrafını değiştir"
        >
          <View style={styles.avatarRing}>
            {uploadingProfile ? (
              <View style={styles.avatarLoading}>
                <ActivityIndicator size="small" color="#1DA1F2" />
              </View>
            ) : (
              <Image
                source={profileImageUri ? { uri: profileImageUri } : DefaultAvatar}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            )}
          </View>

          {!uploadingProfile ? (
            <View style={styles.avatarCameraBadge}>
              <Icon name="camera" size={16} color="#fff" />
            </View>
          ) : null}
        </TouchableOpacity>

        <Text style={styles.avatarHint}>Fotoğrafa dokunarak değiştir</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
  },
  coverTouchable: {
    height: COVER_HEIGHT,
    width: '100%',
    backgroundColor: DEFAULT_COVER_COLOR,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: DEFAULT_COVER_COLOR,
  },
  coverScrimBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  coverLoading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  coverAction: {
    position: 'absolute',
    right: 16,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  coverActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginTop: -AVATAR_OVERLAP,
    gap: 14,
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  avatarCameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1DA1F2',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    paddingBottom: 10,
  },
});

export default ProfileEditMediaHero;
