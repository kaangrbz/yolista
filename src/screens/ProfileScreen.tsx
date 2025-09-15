import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/alert';
import { navigate, PageName } from '../types/navigation';
import UserModel from '../model/user.model';
import { RouteWithProfile } from '../model/routes.model';
import { Profile } from '../model/profile.model';
import ProfileEditModal from '../components/profile/ProfileEditModal';
import ImageViewer from '../components/ImageViewer';
import { useProfilePosts } from '../hooks/usePosts';
import {
  ProfileHeader,
  ProfileInfo,
  ProfileStats,
  ProfileTabs,
  ProfilePostsGrid,
  ProfilePostsList,
  ProfileSavedPosts,
  ProfileLikedPosts,
} from '../components/profile';

interface ProfileScreenProps {
  route?: {
    params?: {
      userId?: string;
      currentUserId?: string;
    };
  };
}

type ProfileStackParamList = {
  ProfileMain: { userId?: string; currentUserId?: string };
  RouteDetail: { routeId: string };
  Explore: { categoryId?: number };
  Followers: { userId: string };
  Following: { userId: string };
};

type ProfileScreenNavigationProp = any;

const ProfileScreen: React.FC<ProfileScreenProps> = ({ route }) => {
  // Route parametrelerini güvenli şekilde al
  const routeParams = route?.params || {};
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [followings, setFollowings] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isFollowLoading, setIsFollowLoading] = useState<boolean>(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [headerImageUri, setHeaderImageUri] = useState<string | null>(null);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [isHeaderImageViewerVisible, setIsHeaderImageViewerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const [savedPosts, setSavedPosts] = useState<RouteWithProfile[]>([]);
  const [likedPosts, setLikedPosts] = useState<RouteWithProfile[]>([]);

  // Posts hook
  const { posts: routes, isLoading: postsLoading, refresh: refreshPosts, loadMore, hasMore } = useProfilePosts(profileUserId || '', 20);


  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const isCurrentUserProfile = currentUserId && profileUserId && currentUserId === profileUserId;

  // Fetch user data
  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setCurrentUserId(currentUser.id);
        const targetUserId = routeParams.userId || currentUser.id;

        setProfileUserId(targetUserId);

        const { data: profileUser, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetUserId)
          .single();

        if (profileUser) {
          setUser(profileUser);
          // Download images in parallel
          await Promise.all([
            downloadImage(profileUser.image_url, 'profiles', setImageUri, targetUserId),
            downloadImage(profileUser.header_image_url, 'headers', setHeaderImageUri, targetUserId),
          ]);
        }

        if (targetUserId !== currentUser.id) {
          await checkFollowStatus(currentUser.id, targetUserId);
        }

        // Fetch additional data after user is loaded
        const isOwnProfile = targetUserId === currentUser.id;
        await Promise.all([
          fetchFollowers(targetUserId),
          fetchFollowings(targetUserId),
          isOwnProfile ? fetchSavedPosts() : Promise.resolve(),
          isOwnProfile ? fetchLikedPosts() : Promise.resolve(),
        ]);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Download image
  const downloadImage = async (image_url: string | undefined, bucketName: string, setImageUri: (uri: string | null) => void, userId?: string) => {
    if (!image_url || (!profileUserId && !userId)) {
      setImageUri(null);
      return;
    }

    const targetUserId = userId || profileUserId;
    if (!targetUserId) {
      setImageUri(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .storage
        .from(bucketName)
        .download(`${targetUserId}/${image_url}`);

      if (error) {throw error;}

      const reader = new FileReader();
      const uri = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(data);
      });

      setImageUri(uri);
    } catch (error) {
      console.error('Error downloading image:', error);
      setImageUri(null);
    }
  };


  // Kaydedilen postları getir
  const fetchSavedPosts = async () => {
    if (!currentUserId || !isCurrentUserProfile) {return;}
    try {
      // Bu fonksiyon bookmark model'den gelecek
      // Şimdilik boş array
      setSavedPosts([]);
    } catch (error) {
      console.error('Error fetching saved posts:', error);
    }
  };

  // Beğenilen postları getir
  const fetchLikedPosts = async () => {
    if (!currentUserId || !isCurrentUserProfile) {return;}
    try {
      // Bu fonksiyon likes model'den gelecek
      // Şimdilik boş array
      setLikedPosts([]);
    } catch (error) {
      console.error('Error fetching liked posts:', error);
    }
  };

  // Fetch followers and following
  const fetchFollowers = async (userId?: string) => {
    const targetUserId = userId || profileUserId;
    if (!targetUserId) {return;}
    try {
      const followers = await UserModel.getFollowers(targetUserId);
      setFollowers(followers || []);
    } catch (error) {
      console.error('Error fetching followers:', error);
    }
  };

  const fetchFollowings = async (userId?: string) => {
    const targetUserId = userId || profileUserId;
    if (!targetUserId) {return;}
    try {
      const followings = await UserModel.getFollowings(targetUserId);
      setFollowings(followings || []);
    } catch (error) {
      console.error('Error fetching followings:', error);
    }
  };

  // Check follow status
  const checkFollowStatus = async (followerId: string, followingId: string) => {
    try {
      const isUserFollowing = await UserModel.isFollowing(followerId, followingId);
      setIsFollowing(isUserFollowing);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  // Handle follow toggle
  const handleFollowToggle = async () => {
    if (!currentUserId || !profileUserId || isCurrentUserProfile) {return;}

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        const result = await UserModel.unfollowUser(currentUserId, profileUserId);
        if (result.success) {
          setIsFollowing(false);
          showToast('success', result.message);
          fetchFollowers();
        } else {
          showToast('error', result.message);
        }
      } else {
        const result = await UserModel.followUser(currentUserId, profileUserId);
        if (result.success) {
          setIsFollowing(true);
          fetchFollowers();
        } else {
          showToast('error', result.message);
        }
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
      showToast('error', 'İşlem sırasında bir hata oluştu');
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate(navigation, PageName.Login);
    } catch (error) {
      console.error('Error logging out:', error);
      showToast('error', 'Çıkış yapılırken bir hata oluştu');
    }
  };

  // Handle profile update
  const handleProfileUpdate = (updatedProfile: Profile) => {
    setUser(updatedProfile);
  };

  // Handle image update
  const handleImageUpdate = (type: 'profile' | 'header', newImageUri: string) => {
    if (type === 'profile') {
      setImageUri(newImageUri);
    } else if (type === 'header') {
      setHeaderImageUri(newImageUri);
    }
  };

  // Event handlers
  const handleRoutePress = (routeId: string) => {
    navigation.navigate('RouteDetail', { routeId });
  };

  const handleFollowersPress = () => {
    if (profileUserId) {
      navigation.navigate('Followers', { userId: profileUserId });
    }
  };

  const handleFollowingPress = () => {
    if (profileUserId) {
      navigation.navigate('Following', { userId: profileUserId });
    }
  };

  // Refresh function
  const onRefresh = async () => {
    try {
      setRefreshing(true);

      // Önce user bilgilerini yükle ki profileUserId güncellensin
      await fetchUser();

      // Sonra posts'ları yenile
      if (refreshPosts) {
        await refreshPosts();
      }

    } catch (error) {
      console.error('Error refreshing data:', error);
      showToast('error', 'Veriler yenilenirken bir hata oluştu');
    } finally {
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUser();
  }, [routeParams.userId]);

  if (!user && !isLoading) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Kullanıcı bulunamadı</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1DA1F2']}
            tintColor="#1DA1F2"
          />
        }
      >
        <ProfileHeader
          headerImageUri={headerImageUri}
          isCurrentUserProfile={!!isCurrentUserProfile}
          isFollowing={isFollowing}
          isFollowLoading={isFollowLoading}
          onHeaderImagePress={() => setIsHeaderImageViewerVisible(true)}
          onEditPress={() => setIsEditModalVisible(true)}
          onLogoutPress={handleLogout}
          onFollowToggle={handleFollowToggle}
          userId={profileUserId || undefined}
          loading={isLoading || !user}
        />

        <ProfileInfo
          user={user || {} as any}
          imageUri={imageUri}
          onProfileImagePress={() => setIsImageViewerVisible(true)}
          userId={profileUserId || undefined}
          loading={isLoading || !user}
        />

        <ProfileStats
          postsCount={routes.length}
          followersCount={followers.length}
          followingCount={followings.length}
          onFollowersPress={handleFollowersPress}
          onFollowingPress={handleFollowingPress}
          loading={isLoading || !user}
        />

        <ProfileTabs
          activeTab={activeTab}
          isCurrentUserProfile={!!isCurrentUserProfile}
          onTabChange={setActiveTab}
        />

        <View style={styles.tabContent}>
          {activeTab === 0 && (
            <ProfilePostsGrid
              routes={routes}
              onRoutePress={handleRoutePress}
              loading={postsLoading || isLoading || !user}
            />
          )}
          {activeTab === 1 && (
            <ProfilePostsList
              routes={routes}
              currentUserId={currentUserId}
            />
          )}
          {isCurrentUserProfile && activeTab === 2 && (
            <ProfileSavedPosts
              savedPosts={savedPosts}
              currentUserId={currentUserId}
            />
          )}
          {isCurrentUserProfile && activeTab === 3 && (
            <ProfileLikedPosts
              likedPosts={likedPosts}
              currentUserId={currentUserId}
            />
          )}
        </View>
      </ScrollView>


      {/* Modals */}
      {user && (
        <ProfileEditModal
          visible={isEditModalVisible}
          onClose={() => setIsEditModalVisible(false)}
          profile={user}
          imageUri={imageUri}
          headerImageUri={headerImageUri}
          onUpdate={handleProfileUpdate}
          onImageUpdate={handleImageUpdate}
        />
      )}

      <ImageViewer
        images={imageUri ? [{ uri: imageUri }] : []}
        visible={isImageViewerVisible}
        onRequestClose={() => setIsImageViewerVisible(false)}
      />
      <ImageViewer
        images={headerImageUri ? [{ uri: headerImageUri }] : []}
        visible={isHeaderImageViewerVisible}
        onRequestClose={() => setIsHeaderImageViewerVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    minHeight: 500, // Increased minimum height
    paddingTop: 10,
  },
});

export default ProfileScreen;
