import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Profile } from '../../../model/profile.model';
import { DefaultAvatar } from '../../../assets';
import ImageViewer from '../../ImageViewer';

const { width } = Dimensions.get('window');

interface ProfileHeaderProps {
  user: Profile | null;
  imageUri: string | null;
  headerImageUri: string | null;
  isCurrentUserProfile: boolean;
  isFollowing: boolean;
  isFollowLoading: boolean;
  onEditPress: () => void;
  onLogoutPress: () => void;
  onFollowToggle: () => void;
  onImagePress: () => void;
  onHeaderImagePress: () => void;
  isImageViewerVisible: boolean;
  isHeaderImageViewerVisible: boolean;
  onCloseImageViewer: () => void;
  onCloseHeaderImageViewer: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  imageUri,
  headerImageUri,
  isCurrentUserProfile,
  isFollowing,
  isFollowLoading,
  onEditPress,
  onLogoutPress,
  onFollowToggle,
  onImagePress,
  onHeaderImagePress,
  isImageViewerVisible,
  isHeaderImageViewerVisible,
  onCloseImageViewer,
  onCloseHeaderImageViewer,
}) => {
  if (!user) return null;

  return (
    <View style={styles.container}>
      {/* Header Image with Gradient Overlay */}
      <View style={styles.headerImageContainer}>
        <TouchableOpacity
          onPress={onHeaderImagePress}
          disabled={!headerImageUri}
          style={styles.headerImageTouchable}
        >
          {headerImageUri ? (
            <Image
              source={{ uri: headerImageUri }}
              style={styles.headerImage}
            />
          ) : (
            <View style={styles.placeholderHeader}>
              <Icon name="image-outline" size={48} color="rgba(255,255,255,0.7)" />
            </View>
          )}
          
          {/* Dark Overlay */}
          <View style={styles.darkOverlay} />
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {isCurrentUserProfile ? (
            <>
              <TouchableOpacity style={styles.actionButton} onPress={onEditPress}>
                <Icon name="pencil" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={onLogoutPress}>
                <Icon name="logout" size={20} color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing && styles.unfollowButton,
              ]}
              onPress={onFollowToggle}
              disabled={isFollowLoading}
            >
              {isFollowLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon 
                    name={isFollowing ? "account-minus" : "account-plus"} 
                    size={16} 
                    color="#fff" 
                  />
                  <Text style={styles.followButtonText}>
                    {isFollowing ? 'Takibi Bırak' : 'Takip Et'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Profile Photo with Modern Design */}
      <View style={styles.profilePhotoContainer}>
        <View style={styles.profilePhotoBorder}>
          <TouchableOpacity
            onPress={onImagePress}
            disabled={!imageUri}
            style={styles.profilePhotoTouchable}
          >
            <Image
              source={imageUri ? { uri: imageUri } : DefaultAvatar}
              style={styles.profilePhoto}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* User Info with Modern Cards */}
      <View style={styles.userInfoContainer}>
        <View style={styles.nameContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.fullName}>{user.full_name || 'Kullanıcı'}</Text>
            {user.is_verified && (
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="verified" size={18} color="#1DA1F2" />
              </View>
            )}
          </View>
          <Text style={styles.username}>@{user.username || 'kullanici'}</Text>
        </View>

        {user.description && (
          <View style={styles.descriptionCard}>
            <Text style={styles.description}>{user.description}</Text>
          </View>
        )}

        {user.website && (
          <TouchableOpacity
            onPress={() => {
              if (user.website) {
                const url = user.website.startsWith('http://') 
                  ? user.website.replace('http://', 'https://')
                  : user.website.startsWith('https://') 
                    ? user.website 
                    : `https://${user.website}`;
                Linking.openURL(url);
              }
            }}
            style={styles.websiteCard}
          >
            <Icon name="link" size={16} color="#1DA1F2" />
            <Text style={styles.website}>{user.website}</Text>
            <Icon name="open-in-new" size={14} color="#1DA1F2" />
          </TouchableOpacity>
        )}
      </View>

      {/* Image Viewers */}
      <ImageViewer
        images={imageUri ? [{ uri: imageUri }] : []}
        visible={isImageViewerVisible}
        onRequestClose={onCloseImageViewer}
      />
      <ImageViewer
        images={headerImageUri ? [{ uri: headerImageUri }] : []}
        visible={isHeaderImageViewerVisible}
        onRequestClose={onCloseHeaderImageViewer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'hidden',
  },
  headerImageContainer: {
    width: '100%',
    height: 240,
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  headerImageTouchable: {
    width: '100%',
    height: '100%',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  placeholderHeader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#667eea',
  },
  darkOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  actionButtonsContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  followButton: {
    backgroundColor: '#1DA1F2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#1DA1F2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  unfollowButton: {
    backgroundColor: '#E0245E',
    shadowColor: '#E0245E',
  },
  followButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  profilePhotoContainer: {
    position: 'absolute',
    bottom: -50,
    left: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePhotoBorder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  profilePhotoTouchable: {
    width: '100%',
    height: '100%',
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
  },
  userInfoContainer: {
    marginTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  nameContainer: {
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  fullName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  verifiedBadge: {
    marginLeft: 8,
    backgroundColor: 'rgba(29, 161, 242, 0.1)',
    borderRadius: 12,
    padding: 2,
  },
  username: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
  descriptionCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#1DA1F2',
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  websiteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e3f2fd',
    gap: 8,
  },
  website: {
    color: '#1DA1F2',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
});

export default ProfileHeader;
