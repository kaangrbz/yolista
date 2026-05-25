import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { DefaultAvatar } from '../../assets';
import { PostHeaderProps } from '../../types/post.types';
import { useProfileImageDownload } from '../../hooks/useImageDownload';
import PostDropdownMenu from '../PostDropdownMenu';

const PostHeader: React.FC<PostHeaderProps> = ({
  username,
  userImage,
  userImagePreview,
  userId,
  location,
  onProfilePress,
  onMorePress,
  onReportPress,
  onBlockPress,
  onFollowPress,
  onUnfollowPress,
  onEditPress,
  onDeletePress,
  onSharePress,
  onCopyLinkPress,
  isOwnPost = false,
  isFollowing = false,
  isVerified = false,
}) => {
  // Use the profile image download hook if userId is provided
  const { imageUri: downloadedImageUri, loading: imageLoading } = useProfileImageDownload(
    userId ? userImage : undefined,
    userId || '',
    userImagePreview
  );

  // Use downloaded image if available, otherwise fallback to userImage or DefaultAvatar
  const profileImageSource = downloadedImageUri
    ? { uri: downloadedImageUri }
    : userImage
    ? { uri: userImage }
    : DefaultAvatar;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.userInfo} onPress={onProfilePress}>
        <Image
          source={profileImageSource}
          style={styles.profileImage}
          resizeMode="cover"
        />
        <View style={styles.userDetails}>
          <View style={styles.usernameRow}>
            <Text style={styles.username} numberOfLines={1}>{username}</Text>
            {isVerified ? (
              <MaterialIcons
                name="verified"
                size={14}
                color="#1DA1F2"
                style={styles.verifiedIcon}
              />
            ) : null}
          </View>
          {location && <Text style={styles.location}>{location}</Text>}
        </View>
      </TouchableOpacity>
      <PostDropdownMenu
        isOwnPost={isOwnPost}
        isFollowing={isFollowing}
        onReport={onReportPress}
        onBlock={onBlockPress}
        onFollow={onFollowPress}
        onUnfollow={onUnfollowPress}
        onEdit={onEditPress}
        onDelete={onDeletePress}
        onShare={onSharePress}
        onCopyLink={onCopyLinkPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
    flexShrink: 1,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  location: {
    fontSize: 12,
    color: '#8e8e8e',
  },
});

export default PostHeader;
