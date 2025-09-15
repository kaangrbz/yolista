import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CachedImage from '../common/CachedImage';
import ProfileHeaderSkeleton from './ProfileHeaderSkeleton';

interface ProfileHeaderProps {
  headerImageUri: string | null;
  isCurrentUserProfile: boolean;
  isFollowing: boolean;
  isFollowLoading: boolean;
  onHeaderImagePress: () => void;
  onEditPress: () => void;
  onLogoutPress: () => void;
  onFollowToggle: () => void;
  userId?: string;
  loading?: boolean;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  headerImageUri,
  isCurrentUserProfile,
  isFollowing,
  isFollowLoading,
  onHeaderImagePress,
  onEditPress,
  onLogoutPress,
  onFollowToggle,
  userId,
  loading = false,
}) => {
  if (loading) {
    return <ProfileHeaderSkeleton />;
  }

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        onPress={onHeaderImagePress}
        disabled={!headerImageUri}
      >
        <CachedImage
          source={headerImageUri ? { uri: headerImageUri } : { uri: 'https://via.placeholder.com/400x200/667eea/ffffff?text=Header+Image' }}
          style={styles.headerImage}
          resizeMode="cover"
          bucketName="headers"
          userId={userId}
          fallbackSource={{ uri: 'https://via.placeholder.com/400x200/667eea/ffffff?text=Header+Image' }}
        />
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {isCurrentUserProfile ? (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onEditPress}
            >
              <Icon name="pencil" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onLogoutPress}
            >
              <Icon name="logout" size={20} color="#fff" />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.unfollowButton]}
            onPress={onFollowToggle}
            disabled={isFollowLoading}
          >
            {isFollowLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon
                name={isFollowing ? 'account-minus' : 'account-plus'}
                size={16}
                color="#fff"
              />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    position: 'relative',
    height: 200,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  actionButtons: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 20,
  },
  followButton: {
    backgroundColor: '#1DA1F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unfollowButton: {
    backgroundColor: '#E0245E',
  },
});

export default ProfileHeader;
