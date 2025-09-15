import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Profile } from '../../model/profile.model';
import { DefaultAvatar } from '../../assets';
import CachedImage from '../common/CachedImage';
import ProfileInfoSkeleton from './ProfileInfoSkeleton';

interface ProfileInfoProps {
  user: Profile;
  imageUri: string | null;
  onProfileImagePress: () => void;
  userId?: string;
  loading?: boolean;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({
  user,
  imageUri,
  onProfileImagePress,
  userId,
  loading = false,
}) => {
  const handleWebsitePress = () => {
    if (!user.website) {return;}

    const url = user.website.startsWith('http')
      ? user.website
      : `https://${user.website}`;
    Linking.openURL(url);
  };

  if (loading) {
    return <ProfileInfoSkeleton />;
  }

  return (
    <View style={styles.profileInfo}>
      {/* Profile Photo */}
      <TouchableOpacity
        onPress={onProfileImagePress}
        disabled={!imageUri}
        style={styles.profilePhotoContainer}
      >
        <CachedImage
          source={imageUri ? { uri: imageUri } : DefaultAvatar}
          style={styles.profilePhoto}
          resizeMode="cover"
          bucketName="profiles"
          userId={userId}
          fallbackSource={DefaultAvatar}
        />
      </TouchableOpacity>

      {/* User Details */}
      <View style={styles.userDetails}>
        <View style={styles.nameRow}>
          <Text style={styles.fullName}>{user.full_name || 'Kullanıcı'}</Text>
          {user.is_verified && (
            <MaterialIcons name="verified" size={20} color="#1DA1F2" />
          )}
        </View>
        <Text style={styles.username}>@{user.username || 'kullanici'}</Text>

        {user.description && (
          <Text style={styles.description}>{user.description}</Text>
        )}

        {user.website && (
          <TouchableOpacity
            onPress={handleWebsitePress}
            style={styles.websiteContainer}
          >
            <Icon name="link" size={16} color="#1DA1F2" />
            <Text style={styles.website}>{user.website}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  profileInfo: {
    padding: 20,
    alignItems: 'center',
  },
  profilePhotoContainer: {
    marginTop: -50,
    marginBottom: 16,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
  },
  userDetails: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  fullName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 8,
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  websiteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  website: {
    color: '#1DA1F2',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ProfileInfo;
