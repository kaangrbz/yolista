import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Profile } from '../../model/profile.model';
import { DefaultAvatar } from '../../assets';
import CachedImage from '../common/CachedImage';
import ProfileInfoSkeleton from './ProfileInfoSkeleton';
import ProfileBadges from './ProfileBadges';
import type { ProfileBadge } from '../../model/profile.model';
import ModalSheetSafeArea from '../common/ModalSheetSafeArea';
import { parseWebsiteInput } from '../../utils/websiteUtils';

interface ProfileInfoProps {
  user: Profile;
  imageUri: string | null;
  onProfileImagePress: () => void;
  userId?: string;
  loading?: boolean;
  isCurrentUserProfile: boolean;
  isFollowing: boolean;
  isFollowLoading: boolean;
  onEditPress: () => void;
  onFollowToggle: () => void;
  badges?: ProfileBadge[];
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({
  user,
  imageUri,
  onProfileImagePress,
  userId,
  loading = false,
  isCurrentUserProfile,
  isFollowing,
  isFollowLoading,
  onEditPress,
  onFollowToggle,
  badges,
}) => {
  const [isWebsitesModalVisible, setIsWebsitesModalVisible] = useState(false);

  const websiteList = useMemo(() => {
    return parseWebsiteInput(user.website);
  }, [user.website]);

  const handleWebsitePress = (rawWebsite: string) => {
    if (!rawWebsite) {
      return;
    }

    const url = rawWebsite.startsWith('http')
      ? rawWebsite
      : `https://${rawWebsite}`;

    Linking.openURL(url);
  };

  const visibleWebsites = websiteList.slice(0, 2);
  const hasMoreWebsites = websiteList.length > 2;

  if (loading) {
    return <ProfileInfoSkeleton />;
  }

  return (
    <View style={styles.profileInfo}>
      <View style={styles.rowOne}>
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

        <View style={styles.identityBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.fullName} numberOfLines={2}>
              {user.full_name || 'Kullanıcı'}
            </Text>
            <ProfileBadges badges={badges ?? []} />
          </View>
          <Text style={styles.username} numberOfLines={1}>
            @{user.username || 'kullanici'}
          </Text>
        </View>

        <View style={styles.ctaWrap}>
          {isCurrentUserProfile ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={onEditPress}
              accessibilityLabel="Profili düzenle"
            >
              <Text style={styles.editButtonText}>Düzenle</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.unfollowButton]}
              onPress={onFollowToggle}
              disabled={isFollowLoading}
              accessibilityLabel={isFollowing ? 'Takipten çık' : 'Takip et'}
            >
              {isFollowLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.followButtonText}>
                  {isFollowing ? 'Takipten çık' : 'Takip et'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {user.description ? (
        <Text style={styles.description}>{user.description}</Text>
      ) : null}

      {websiteList.length > 0 ? (
        <View style={styles.websitesBlock}>
          {visibleWebsites.map((website, index) => (
            <TouchableOpacity
              key={`${website}-${index}`}
              onPress={() => handleWebsitePress(website)}
              style={styles.websiteContainer}
              accessibilityRole="link"
            >
              <Icon name="link" size={14} color="#1DA1F2" />
              <Text style={styles.website} numberOfLines={1}>
                {website}
              </Text>
            </TouchableOpacity>
          ))}

          {hasMoreWebsites ? (
            <TouchableOpacity
              onPress={() => setIsWebsitesModalVisible(true)}
              style={styles.moreWebsitesButton}
            >
              <Text style={styles.moreWebsitesText}>
                +{websiteList.length - 2} website daha
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <Modal
        visible={isWebsitesModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsWebsitesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ModalSheetSafeArea style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Website Linkleri</Text>
              <TouchableOpacity onPress={() => setIsWebsitesModalVisible(false)}>
                <Text style={styles.modalCloseText}>Kapat</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {websiteList.map((website, index) => (
                <TouchableOpacity
                  key={`modal-${website}-${index}`}
                  style={styles.modalWebsiteItem}
                  onPress={() => {
                    handleWebsitePress(website);
                    setIsWebsitesModalVisible(false);
                  }}
                  accessibilityRole="link"
                >
                  <Icon name="link-variant" size={16} color="#1DA1F2" />
                  <Text style={styles.modalWebsiteText}>
                    {website}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ModalSheetSafeArea>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  profileInfo: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'stretch',
  },
  rowOne: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profilePhotoContainer: {
    marginRight: 12,
  },
  profilePhoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  identityBlock: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  fullName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    flexShrink: 1,
  },
  username: {
    fontSize: 14,
    color: '#666',
  },
  ctaWrap: {
    marginLeft: 8,
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 88,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  followButton: {
    backgroundColor: '#1DA1F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  unfollowButton: {
    backgroundColor: '#E0245E',
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  description: {
    fontSize: 15,
    color: '#333',
    textAlign: 'left',
    lineHeight: 21,
    marginBottom: 10,
  },
  websiteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  website: {
    color: '#1DA1F2',
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
  },
  websitesBlock: {
    alignSelf: 'flex-start',
  },
  moreWebsitesButton: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  moreWebsitesText: {
    color: '#1DA1F2',
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '55%',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
  },
  modalCloseText: {
    color: '#1DA1F2',
    fontSize: 14,
    fontWeight: '600',
  },
  modalList: {
    flexGrow: 0,
  },
  modalWebsiteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  modalWebsiteText: {
    color: '#1DA1F2',
    fontSize: 14,
    flex: 1,
  },
});

export default ProfileInfo;
