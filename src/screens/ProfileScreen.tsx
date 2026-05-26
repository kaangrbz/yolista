import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ThemedRefreshControl from '../components/common/ThemedRefreshControl';
import { useThemedScrollSurface } from '../theme/useThemedScrollSurface';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/alert';
import { useAuth } from '../context/AuthContext';
import { navigate, PageName } from '../types/navigation';
import type { SocialUserListRouteParams } from '../types/socialUserList';
import UserModel from '../model/user.model';
import RouteModel, { RouteWithProfile } from '../model/routes.model';
import { Profile, ProfileBadge } from '../model/profile.model';
import { fetchBadgesForUser } from '../lib/profileBadges';
import ProfileEditModal from '../components/profile/ProfileEditModal';
import { deleteAccount } from '../services/AccountService';
import ImageViewer from '../components/ImageViewer';
import ShareModal from '../components/ShareModal';
import { showConfirm } from '../components/common/ConfirmModal';
import { ShareService } from '../services/ShareService';
import { decodeProfileUsername } from '../utils/profileSlug';
import {
  isSameProfile,
  isInitialListLoading,
  mergeRoutesPreservingUnchanged,
} from '../utils/listRefreshUtils';
import { ImageService } from '../services/ImageService';
import { useImageDownload, useProfileImageDownload } from '../hooks/useImageDownload';
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
  ProfileSettingsModal,
} from '../components/profile';
import { useThemedStyles } from '../theme/useThemedStyles';

interface ProfileScreenProps {
  route?: {
    params?: {
      username?: string;
      currentUserId?: string;
    };
  };
}

type ProfileStackParamList = {
  ProfileMain: { username?: string; currentUserId?: string };
  RouteDetail: { routeId: string };
  Explore: { categoryId?: number };
  SocialUserList: SocialUserListRouteParams;
};

type ProfileScreenNavigationProp = any;

const SAVED_LIKED_PAGE_SIZE = 20;

const PROFILE_SELECT_COLUMNS = [
  'id',
  'username',
  'full_name',
  'description',
  'website',
  'image_url',
  'image_preview_url',
  'header_image_url',
  'header_image_preview_url',
  'is_verified',
  'created_at',
  'updated_at',
].join(', ');

const resolveRouteUsername = (
  routeUsername?: string,
  authUsername?: string,
): string | null => {
  if (routeUsername?.trim()) {
    return routeUsername.trim();
  }

  if (authUsername?.trim()) {
    return authUsername.trim();
  }

  return null;
};

const mergeRoutesById = (previous: RouteWithProfile[], next: RouteWithProfile[]): RouteWithProfile[] => {
  const seen = new Set(previous.map((route) => route.id).filter(Boolean));
  const merged = [...previous];

  for (const route of next) {
    if (!route.id || seen.has(route.id)) {
      continue;
    }

    seen.add(route.id);
    merged.push(route);
  }

  return merged;
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({ route }) => {
  const { reloadAuth, user: authUser, isEmailConfirmed } = useAuth();
  const scrollSurface = useThemedScrollSurface();
  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.background,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: t.background,
    },
    errorText: {
      fontSize: 18,
      color: t.textSecondary,
    },
    scrollView: {
      flex: 1,
      backgroundColor: t.background,
    },
    tabContent: {
      flex: 1,
      minHeight: 500,
      backgroundColor: t.background,
    },
  }));

  const routeParams = route?.params || {};
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(
    () => authUser?.id || routeParams.currentUserId || null,
  );
  const [user, setUser] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<ProfileBadge[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isFollowLoading, setIsFollowLoading] = useState<boolean>(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isProfileShareModalVisible, setIsProfileShareModalVisible] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [modalImageUri, setModalImageUri] = useState<string | null>(null);
  const [modalHeaderImageUri, setModalHeaderImageUri] = useState<string | null>(null);
  const [profileHighUri, setProfileHighUri] = useState<string | null>(null);
  const [headerHighUri, setHeaderHighUri] = useState<string | null>(null);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [isHeaderImageViewerVisible, setIsHeaderImageViewerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const [savedPosts, setSavedPosts] = useState<RouteWithProfile[]>([]);
  const [likedPosts, setLikedPosts] = useState<RouteWithProfile[]>([]);
  const [savedHasMore, setSavedHasMore] = useState(true);
  const [likedHasMore, setLikedHasMore] = useState(true);
  const [savedLoadingMore, setSavedLoadingMore] = useState(false);
  const [likedLoadingMore, setLikedLoadingMore] = useState(false);
  const [savedTabLoading, setSavedTabLoading] = useState(false);
  const [likedTabLoading, setLikedTabLoading] = useState(false);
  const savedPageRef = useRef(0);
  const likedPageRef = useRef(0);
  const savedTabLoadedRef = useRef(false);
  const likedTabLoadedRef = useRef(false);

  const { posts: routes, isLoading: postsLoading, refresh: refreshPosts } = useProfilePosts(profileUserId || '', 20);

  const profileImageUserId = profileUserId || '';
  const { imageUri: downloadedProfileUri } = useProfileImageDownload(
    user?.image_url,
    profileImageUserId,
    user?.image_preview_url,
  );
  const headerStorageKey = user?.header_image_preview_url || user?.header_image_url;
  const { imageUri: downloadedHeaderUri } = useImageDownload(
    headerStorageKey,
    'headers',
    profileImageUserId,
  );

  const displayProfileUri = modalImageUri ?? downloadedProfileUri;
  const displayHeaderUri = modalHeaderImageUri ?? downloadedHeaderUri;

  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const isCurrentUserProfile = currentUserId && profileUserId && currentUserId === profileUserId;
  const isInitialProfileLoading = isProfileLoading && !user;
  const isInitialStatsLoading = (isProfileLoading || isStatsLoading) && !user;
  const isInitialPostsLoading = isInitialListLoading(postsLoading, routes.length);

  const fetchProfileStats = async (
    targetUserId: string,
    options?: { silent?: boolean },
  ) => {
    const silent = options?.silent === true;

    if (!silent) {
      setIsStatsLoading(true);
    }

    try {
      const [followersResult, followingsResult] = await Promise.all([
        UserModel.getFollowersCount(targetUserId),
        UserModel.getFollowingsCount(targetUserId),
      ]);

      setFollowersCount((previous) => {
        const next = followersResult ?? 0;

        if (previous === next) {
          return previous;
        }

        return next;
      });
      setFollowingCount((previous) => {
        const next = followingsResult ?? 0;

        if (previous === next) {
          return previous;
        }

        return next;
      });
    } catch (error) {
      console.error('Error fetching profile stats:', error);
    } finally {
      if (!silent) {
        setIsStatsLoading(false);
      }
    }
  };

  const fetchUser = async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;

    try {
      if (!silent) {
        setIsProfileLoading(true);
      }

      let loggedInUserId = authUser?.id || currentUserId;

      if (!loggedInUserId) {
        const { data: { user: sessionUser } } = await supabase.auth.getUser();

        if (!sessionUser) {
          return;
        }

        loggedInUserId = sessionUser.id;
        setCurrentUserId(sessionUser.id);
      }

      const routeUsername = resolveRouteUsername(
        routeParams.username,
        authUser?.profile?.username,
      );

      if (!routeUsername) {
        setUser(null);
        setProfileUserId(null);

        return;
      }

      const username = decodeProfileUsername(routeUsername);

      const { data: profileUser, error } = await supabase
        .from('profiles')
        .select(PROFILE_SELECT_COLUMNS)
        .eq('username', username)
        .single();

      const fetchedProfile = profileUser as unknown as Profile | null;
      const targetUserId = fetchedProfile?.id || null;

      setProfileUserId(targetUserId);
      setCurrentUserId(loggedInUserId);

      if (error) {
        console.error('Error fetching profile:', error);
        setUser(null);

        return;
      }

      if (fetchedProfile) {
        const nextProfile = fetchedProfile;

        setUser((previousUser) => {
          if (previousUser && isSameProfile(previousUser, nextProfile)) {
            return previousUser;
          }

          return nextProfile;
        });

        if (!silent) {
          setProfileHighUri(null);
          setHeaderHighUri(null);
          setModalImageUri(null);
          setModalHeaderImageUri(null);
        }
      }

      if (targetUserId) {
        void fetchBadgesForUser(targetUserId).then(setBadges);
      } else {
        setBadges([]);
      }

      if (targetUserId && targetUserId !== loggedInUserId) {
        void checkFollowStatus(loggedInUserId, targetUserId);
      }

      if (targetUserId) {
        void fetchProfileStats(targetUserId, { silent });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      if (!silent) {
        setIsProfileLoading(false);
      }
    }
  };

  const loadSavedInitial = async (authUserId: string, options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    savedPageRef.current = 0;
    setSavedHasMore(true);

    try {
      const savedResult = await RouteModel.getSavedRoutesForUser({
        userId: authUserId,
        loggedUserId: authUserId,
        limit: SAVED_LIKED_PAGE_SIZE,
        offset: 0,
      });

      setSavedPosts((previousPosts) => {
        if (silent && previousPosts.length > 0) {
          return mergeRoutesPreservingUnchanged(previousPosts, savedResult.items);
        }

        return savedResult.items;
      });
      setSavedHasMore(savedResult.hasMore);
      savedPageRef.current = savedResult.hasMore ? 1 : 0;
    } catch (error) {
      console.error('Error fetching saved posts:', error);

      if (!silent) {
        setSavedPosts([]);
        setSavedHasMore(false);
      }
    }
  };

  const loadLikedInitial = async (authUserId: string, options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    likedPageRef.current = 0;
    setLikedHasMore(true);

    try {
      const likedResult = await RouteModel.getLikedRoutesForUser({
        userId: authUserId,
        loggedUserId: authUserId,
        limit: SAVED_LIKED_PAGE_SIZE,
        offset: 0,
      });

      setLikedPosts((previousPosts) => {
        if (silent && previousPosts.length > 0) {
          return mergeRoutesPreservingUnchanged(previousPosts, likedResult.items);
        }

        return likedResult.items;
      });
      setLikedHasMore(likedResult.hasMore);
      likedPageRef.current = likedResult.hasMore ? 1 : 0;
    } catch (error) {
      console.error('Error fetching liked posts:', error);

      if (!silent) {
        setLikedPosts([]);
        setLikedHasMore(false);
      }
    }
  };

  const loadMoreSavedPosts = useCallback(async () => {
    if (!currentUserId || !savedHasMore || savedLoadingMore) {
      return;
    }

    setSavedLoadingMore(true);

    try {
      const offset = savedPageRef.current * SAVED_LIKED_PAGE_SIZE;
      const result = await RouteModel.getSavedRoutesForUser({
        userId: currentUserId,
        loggedUserId: currentUserId,
        limit: SAVED_LIKED_PAGE_SIZE,
        offset,
      });

      setSavedPosts((prev) => mergeRoutesById(prev, result.items));
      setSavedHasMore(result.hasMore);

      if (result.hasMore) {
        savedPageRef.current += 1;
      }
    } catch (error) {
      console.error('Error loading more saved posts:', error);
    } finally {
      setSavedLoadingMore(false);
    }
  }, [currentUserId, savedHasMore, savedLoadingMore]);

  const loadMoreLikedPosts = useCallback(async () => {
    if (!currentUserId || !likedHasMore || likedLoadingMore) {
      return;
    }

    setLikedLoadingMore(true);

    try {
      const offset = likedPageRef.current * SAVED_LIKED_PAGE_SIZE;
      const result = await RouteModel.getLikedRoutesForUser({
        userId: currentUserId,
        loggedUserId: currentUserId,
        limit: SAVED_LIKED_PAGE_SIZE,
        offset,
      });

      setLikedPosts((prev) => mergeRoutesById(prev, result.items));
      setLikedHasMore(result.hasMore);

      if (result.hasMore) {
        likedPageRef.current += 1;
      }
    } catch (error) {
      console.error('Error loading more liked posts:', error);
    } finally {
      setLikedLoadingMore(false);
    }
  }, [currentUserId, likedHasMore, likedLoadingMore]);

  const handleProfileScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!currentUserId) {
      return;
    }

    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const threshold = 280;
    const nearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;

    if (!nearBottom) {
      return;
    }

    if (activeTab === 2) {
      void loadMoreSavedPosts();
      return;
    }

    if (activeTab === 3) {
      void loadMoreLikedPosts();
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
          setFollowersCount((count) => Math.max(0, count - 1));
          showToast('success', result.message);
        } else {
          showToast('error', result.message);
        }
      } else {
        const result = await UserModel.followUser(currentUserId, profileUserId);
        if (result.success) {
          setIsFollowing(true);
          setFollowersCount((count) => count + 1);
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

  const handleDeleteAccountPress = () => {
    showConfirm({
      title: 'Hesabı sil',
      message:
        'Hesabınız kalıcı olarak silinecek; profiliniz, gönderileriniz ve kayıtlarınız geri alınamaz. Devam etmek istiyor musunuz?',
      icon: 'alert-octagon-outline',
      iconColor: '#dc2626',
      actions: [
        { key: 'cancel', label: 'İptal', variant: 'ghost' },
        {
          key: 'delete-account',
          label: 'Hesabımı sil',
          variant: 'destructive',
          onPress: () => {
            void runDeleteAccount();
          },
        },
      ],
    });
  };

  const runDeleteAccount = async () => {
    setDeleteAccountLoading(true);

    try {
      const result = await deleteAccount();

      if (result.error) {
        showToast('error', result.error);
        return;
      }

      showToast('success', 'Hesabınız silindi');
      reloadAuth();
    } catch (error) {
      console.error('Error deleting account:', error);
      showToast('error', 'Hesap silinirken bir hata oluştu');
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  const handleVerifyEmailPress = () => {
    navigation.navigate(
      'VerifyEmail' as never,
      { email: authUser?.email ?? undefined } as never,
    );
  };

  // Handle profile update
  const handleProfileUpdate = (updatedProfile: Profile) => {
    setUser(updatedProfile);
  };

  // Handle image update (modal already saved paths; sync local display URIs)
  const handleImageUpdate = (type: 'profile' | 'header', newImageUri: string, patch: Partial<Profile>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));

    if (type === 'profile') {
      setModalImageUri(newImageUri);
      setProfileHighUri(null);
      return;
    }

    if (type === 'header') {
      setModalHeaderImageUri(newImageUri);
      setHeaderHighUri(null);
    }
  };

  const handleProfileImageOpen = async () => {
    if (!user?.image_url || !profileUserId) {
      return;
    }

    if (user.image_preview_url) {
      const highUri = await ImageService.downloadImage(user.image_url, 'profiles', profileUserId);
      setProfileHighUri(highUri);
    }

    setIsImageViewerVisible(true);
  };

  const handleHeaderImageOpen = async () => {
    if (!user?.header_image_url || !profileUserId) {
      return;
    }

    if (user.header_image_preview_url) {
      const highUri = await ImageService.downloadImage(user.header_image_url, 'headers', profileUserId);
      setHeaderHighUri(highUri);
    }

    setIsHeaderImageViewerVisible(true);
  };

  // Event handlers
  const handleRoutePress = (routeId: string) => {
    navigation.navigate('RouteDetail', { routeId });
  };

  const handleFollowersPress = () => {
    if (profileUserId) {
      navigation.navigate('SocialUserList', {
        kind: 'followers',
        userId: profileUserId,
      });
    }
  };

  const handleFollowingPress = () => {
    if (profileUserId) {
      navigation.navigate('SocialUserList', {
        kind: 'following',
        userId: profileUserId,
      });
    }
  };

  const resetLazyTabCache = () => {
    savedTabLoadedRef.current = false;
    likedTabLoadedRef.current = false;
    setSavedPosts([]);
    setLikedPosts([]);
  };

  // Refresh function
  const onRefresh = async () => {
    try {
      setRefreshing(true);

      await fetchUser({ silent: true });

      if (refreshPosts) {
        await refreshPosts();
      }

      if (isCurrentUserProfile && currentUserId) {
        if (activeTab === 2) {
          savedTabLoadedRef.current = true;

          if (savedPosts.length === 0) {
            setSavedTabLoading(true);
          }

          await loadSavedInitial(currentUserId, { silent: true });
          setSavedTabLoading(false);
        }

        if (activeTab === 3) {
          likedTabLoadedRef.current = true;

          if (likedPosts.length === 0) {
            setLikedTabLoading(true);
          }

          await loadLikedInitial(currentUserId, { silent: true });
          setLikedTabLoading(false);
        }
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      showToast('error', 'Veriler yenilenirken bir hata oluştu');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    resetLazyTabCache();
  }, [routeParams.username]);

  useEffect(() => {
    void fetchUser();
  }, [routeParams.username, authUser?.id, authUser?.profile?.username]);

  useEffect(() => {
    if (!isCurrentUserProfile || !currentUserId) {
      return;
    }

    if (activeTab === 2 && !savedTabLoadedRef.current) {
      savedTabLoadedRef.current = true;
      setSavedTabLoading(true);
      void loadSavedInitial(currentUserId).finally(() => {
        setSavedTabLoading(false);
      });
    }

    if (activeTab === 3 && !likedTabLoadedRef.current) {
      likedTabLoadedRef.current = true;
      setLikedTabLoading(true);
      void loadLikedInitial(currentUserId).finally(() => {
        setLikedTabLoading(false);
      });
    }
  }, [activeTab, isCurrentUserProfile, currentUserId]);

  if (!user && !isProfileLoading) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Kullanıcı bulunamadı</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        style={scrollSurface.style}
        contentContainerStyle={scrollSurface.contentContainerStyle}
        onScroll={handleProfileScroll}
        scrollEventThrottle={400}
        refreshControl={
          <ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ProfileHeader
          headerImageUri={displayHeaderUri}
          isCurrentUserProfile={!!isCurrentUserProfile}
          onHeaderImagePress={handleHeaderImageOpen}
          onSettingsPress={() => setIsSettingsModalVisible(true)}
          onSharePress={
            profileUserId
              ? () => setIsProfileShareModalVisible(true)
              : undefined
          }
          userId={profileUserId || undefined}
          loading={isInitialProfileLoading}
        />

        <ProfileInfo
          user={user || {} as any}
          imageUri={displayProfileUri}
          onProfileImagePress={handleProfileImageOpen}
          userId={profileUserId || undefined}
          loading={isInitialProfileLoading}
          isCurrentUserProfile={!!isCurrentUserProfile}
          isFollowing={isFollowing}
          isFollowLoading={isFollowLoading}
          onEditPress={() => setIsEditModalVisible(true)}
          onFollowToggle={handleFollowToggle}
          badges={badges}
        />

        <ProfileStats
          postsCount={routes.length}
          followersCount={followersCount}
          followingCount={followingCount}
          onFollowersPress={handleFollowersPress}
          onFollowingPress={handleFollowingPress}
          loading={isInitialStatsLoading}
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
              loading={isInitialPostsLoading}
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
              loadingMore={savedLoadingMore}
              initialLoading={savedTabLoading}
            />
          )}
          {isCurrentUserProfile && activeTab === 3 && (
            <ProfileLikedPosts
              likedPosts={likedPosts}
              currentUserId={currentUserId}
              loadingMore={likedLoadingMore}
              initialLoading={likedTabLoading}
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
          imageUri={displayProfileUri}
          headerImageUri={displayHeaderUri}
          onUpdate={handleProfileUpdate}
          onImageUpdate={handleImageUpdate}
          authEmail={authUser?.email}
          isEmailConfirmed={isEmailConfirmed}
          onVerifyEmailPress={() => {
            setIsEditModalVisible(false);
            handleVerifyEmailPress();
          }}
        />
      )}

      {isCurrentUserProfile && (
        <ProfileSettingsModal
          visible={isSettingsModalVisible}
          onClose={() => setIsSettingsModalVisible(false)}
          onEditProfile={() => setIsEditModalVisible(true)}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccountPress}
          deleteLoading={deleteAccountLoading}
        />
      )}

      <ImageViewer
        images={(profileHighUri || displayProfileUri) ? [{ uri: profileHighUri || displayProfileUri! }] : []}
        visible={isImageViewerVisible}
        onRequestClose={() => {
          setIsImageViewerVisible(false);
          setProfileHighUri(null);
        }}
      />
      <ImageViewer
        images={(headerHighUri || displayHeaderUri) ? [{ uri: headerHighUri || displayHeaderUri! }] : []}
        visible={isHeaderImageViewerVisible}
        onRequestClose={() => {
          setIsHeaderImageViewerVisible(false);
          setHeaderHighUri(null);
        }}
      />

      {profileUserId && user?.username ? (
        <ShareModal
          visible={isProfileShareModalVisible}
          onClose={() => setIsProfileShareModalVisible(false)}
          postId={profileUserId}
          postTitle={`${user.full_name || 'Profil'} (@${user.username})`}
          postImage={displayProfileUri || undefined}
          postUrl={ShareService.generateProfileUrl(user.username)}
        />
      ) : null}
    </SafeAreaView>
  );
};

export default ProfileScreen;
