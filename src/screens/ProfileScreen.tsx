import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  RefreshControl,
  ScrollView,
  Platform,
} from 'react-native';
import { Tabs } from 'react-native-collapsible-tab-view';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useCityStore, CityState } from '../store/cityStore';
import RouteModel, { RouteWithProfile } from '../model/routes.model';
import RouteList from '../components/route/RouteList';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/alert';
import { navigate, PageName } from '../types/navigation';
import UserModel from '../model/user.model';
import GlobalFloatingAction from '../components/common/GlobalFloatingAction';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width } = Dimensions.get('window');

interface ProfilePageProps {
  userId: string;
  currentUserId: string;
}

interface ProfileScreenProps {
  route?: {
    params?: {
      userId?: string;
    };
  };
}

type ProfileScreenNavigationProp = NativeStackNavigationProp<any>;

const HEADER_HEIGHT = Platform.OS === 'ios' ? 300 : 320;


const SavedTab = () => {
  return (
    <Tabs.ScrollView>
      <View style={styles.tabContent}>
        <View style={styles.postContainer}>
          <Text style={styles.noContentText}>Kaydedilen öğe yok</Text>
        </View>
      </View>
    </Tabs.ScrollView>
  );
};

const TaggedTab = () => {
  return (
    <Tabs.ScrollView>
      <View style={styles.tabContent}>
        <View style={styles.postContainer}>
          <Text style={styles.noContentText}>Etiketlendiğiniz gönderi yok</Text>
        </View>
      </View>
    </Tabs.ScrollView>
  );
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({ route }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [routes, setRoutes] = useState<RouteWithProfile[]>([]);
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: string]: boolean }>({});
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [followings, setFollowings] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isFollowLoading, setIsFollowLoading] = useState<boolean>(false);
  const [fetchingUser, setFetchingUser] = useState(false);
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const selectedCityId = useCityStore((state: CityState) => state.selectedCityId);

  // Check if the current profile belongs to the logged-in user
  const isCurrentUserProfile = currentUserId === profileUserId;
  const [followingsCount, setFollowingsCount] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setFetchingUser(true);
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          setCurrentUserId(currentUser.id);

          // If no userId is provided in route params, use the current user's ID
          const targetUserId = route?.params?.userId || currentUser.id;
          setProfileUserId(targetUserId);

          // Fetch profile user data
          const { data: profileUser, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', targetUserId)
            .single();

          if (profileUser) {
            setUser(profileUser);
          }

          // Check if current user is following this profile
          if (targetUserId !== currentUser.id) {
            checkFollowStatus(currentUser.id, targetUserId);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setFetchingUser(false);
      }
    };

    fetchUser();
    onRefresh();
  }, [route?.params?.userId]);

  const fetchRoutes = async () => {
    if (!profileUserId) return;

    try {
      setIsLoading(true);
      const routes = await RouteModel.getRoutes({
        limit: 20,
        onlyMain: true,
        userId: profileUserId,
      });
      setRoutes(routes);
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowers = async () => {
    if (!profileUserId) return;

    try {
      setIsLoading(true);
      const followers = await UserModel.getFollowers(profileUserId);
      setFollowers(followers || []);
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowings = async () => {
    if (!profileUserId) return;

    try {
      setIsLoading(true);
      const followings = await UserModel.getFollowings(profileUserId);
      setFollowings(followings || []);
      setFollowingsCount(followings.length);
    } catch (error) {
      console.error('Error fetching followings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (profileUserId) {
      fetchRoutes();
      fetchFollowers();
      fetchFollowings();
    }
  }, [profileUserId]);

  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await fetchRoutes();
      await fetchFollowers();
      await fetchFollowings();

      if (!isCurrentUserProfile && currentUserId && profileUserId) {
        checkFollowStatus(currentUserId, profileUserId);
      }

      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error('Error refreshing data:', error);
      showToast('error', 'Veriler yenilenirken bir hata oluştu');
      setRefreshing(false);
    }
  }, [profileUserId, currentUserId, isCurrentUserProfile]);

  const onRoutePress = useCallback((routeId: string) => {
    navigate(navigation, PageName.RouteDetail, { routeId });
  }, [navigation]);

  const onToggleDescription = useCallback((routeId: string) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [routeId]: !prev[routeId],
    }));
  }, []);

  // Tab Content Components
  const PostsTab = () => {
    
    if (isLoading || refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        <Tabs.ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#333', '#1DA1F2']}
            tintColor="#000000"
          />
        }
      >
        <RouteList
          routes={routes}
          loading={isLoading}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onRoutePress={(routeId) => onRoutePress(routeId)}
          expandedDescriptions={expandedDescriptions}
          onToggleDescription={(routeId) => onToggleDescription(routeId)}
          userId={currentUserId}
          onRefreshRoutes={fetchRoutes}
        />
      </Tabs.ScrollView>
      </SafeAreaView>
    );
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate(navigation, PageName.Login);
    } catch (error) {
      console.error('Error logging out:', error);
      showToast('error', 'Çıkış yapılırken bir hata oluştu');
    }
  };

  const checkFollowStatus = async (followerId: string, followingId: string) => {
    try {
      const isUserFollowing = await UserModel.isFollowing(followerId, followingId);
      setIsFollowing(isUserFollowing);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUserId || !profileUserId || isCurrentUserProfile) return;

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const result = await UserModel.unfollowUser(currentUserId, profileUserId);
        if (result.success) {
          setIsFollowing(false);
          showToast('success', result.message);
          fetchFollowers(); // Refresh followers count
        } else {
          showToast('error', result.message);
        }
      } else {
        // Follow
        const result = await UserModel.followUser(currentUserId, profileUserId);
        if (result.success) {
          setIsFollowing(true);
          // showToast('success', result.message);
          fetchFollowers(); // Refresh followers count
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

  console.log('user', user);

  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <View style={{ width: '100%' }}>
          <View style={styles.headerImageContainer}>
            <Image
              source={{ uri: user?.header_image || 'https://picsum.photos/800/300' }}
              style={styles.headerImage}
            />
            <View style={styles.profilePhotoContainer}>
              <Image
                source={{ uri: user?.image_url || 'https://picsum.photos/200' }}
                style={styles.profilePhoto}
              />
            </View>
          </View>

          {/* Only show these buttons for the current user's profile */}
          {isCurrentUserProfile && (
            <>
              <TouchableOpacity style={styles.logoutContainer} onPress={handleLogout}>
                <Icon name="logout" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.profileSettingContainer}>
                <Icon name="cog" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.profileEditContainer}>
                <Icon name="pencil" size={24} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.headerTextContainer}>
          <View style={styles.headerNameContainer}>
            <Text style={styles.headerName}>
              {user?.full_name || 'Kullanıcı'}
              {user?.verified && <MaterialIcons name="verified" size={16} color="#1DA1F2" />}

            </Text>


            {/* Show follow/unfollow button for other users' profiles */}
            {!isCurrentUserProfile && currentUserId && profileUserId && (
              <TouchableOpacity
                style={[styles.followContainer, isFollowing ? styles.unfollowContainer : {}]}
                onPress={handleFollowToggle}
                disabled={isFollowLoading}
              >
                {isFollowLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.followButtonText}>
                    {isFollowing ? <Icon name="account-minus" size={18} color="#fff" /> : <Icon name="account-plus" size={18} color="#fff" />}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>




          <View style={styles.row}>
            <Text style={styles.headerUsername}>@{user?.username || 'kullanici'}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{routes.length}</Text>
            <Text style={styles.statLabel}>Gönderi</Text>
          </View>
          <TouchableOpacity 
            style={styles.statItem} 
            onPress={() => {
              if (profileUserId) {
                try {
                  navigate(navigation, PageName.Followers, { userId: profileUserId });
                } catch (error) {
                  showToast('error', 'Takipçi sayfasına geçiş yapılırken bir hata oluştu');
                }
              }
            }}
          >
            <Text style={styles.statValue}>{followers?.length || 0}</Text>
            <Text style={styles.statLabel}>Takipçi</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statItem} 
            onPress={() => {
              if (profileUserId) {
                try {
                  navigate(navigation, PageName.Following, { userId: profileUserId });
                } catch (error) {
                  showToast('error', 'Takip edilenler sayfasına geçiş yapılırken bir hata oluştu');
                }
              }
            }}
          >
            <Text style={styles.statValue}>{followings?.length || 0}</Text>
            <Text style={styles.statLabel}>Takip</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };


    
  if (fetchingUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Tabs.Container
        renderHeader={renderHeader}
        headerHeight={HEADER_HEIGHT}
        headerContainerStyle={styles.tabsHeaderContainer}
        containerStyle={styles.tabsContainer}
        initialTabName="posts"
      >
        <Tabs.Tab name="posts" label="Gönderiler">
          <PostsTab />
        </Tabs.Tab>
        <Tabs.Tab name="saved" label="Kaydedilenler">
          <SavedTab />
        </Tabs.Tab>
        <Tabs.Tab name="tagged" label="Etiketler">
          <TaggedTab />
        </Tabs.Tab>
      </Tabs.Container>

      <GlobalFloatingAction />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    backgroundColor: '#fff',
    height: HEADER_HEIGHT,
  },
  headerImageContainer: {
    width: '100%',
    height: 150,
    position: 'relative',
  },
  headerNameContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  profilePhotoContainer: {
    position: 'absolute',
    bottom: -40,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  logoutContainer: {
    position: 'absolute',
    top: 10,
    right: 110,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
  },
  profileSettingContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  profileEditContainer: {
    position: 'absolute',
    top: 10,
    right: 60,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  followContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#1DA1F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignItems: 'center',
  },
  unfollowContainer: {
    backgroundColor: '#E0245E',
  },
  followButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    paddingHorizontal: 0,
  },
  headerTextContainer: {
    marginTop: 50,
    marginLeft: 20,
  },
  headerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  headerUsername: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  row: {
    flexDirection: 'row',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  tabsHeaderContainer: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tabsContainer: {
    backgroundColor: '#fff',
  },
  tabBar: {
    backgroundColor: '#fff',
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontWeight: '600',
    textTransform: 'none',
  },
  tabContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tabContentContainer: {
    flexGrow: 1,
    backgroundColor: '#f9f9f9',
  },
  postContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  noContentText: {
    fontSize: 16,
    color: '#888',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen;
