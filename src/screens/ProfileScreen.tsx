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
  Linking,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
const Tab = createMaterialTopTabNavigator();
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
import { Profile } from '../model/profile.model';
import { Tabs } from 'react-native-collapsible-tab-view';
import ProfileEditModal from '../components/profile/ProfileEditModal';
import ImageViewer from '../components/ImageViewer';
import { DefaultAvatar } from '../assets';

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

type ProfileStackParamList = {
  ProfileMain: { userId?: string };
  RouteDetail: { routeId: string };
  Explore: { categoryId?: number };
  Followers: { userId: string };
  Following: { userId: string };
};

type ProfileScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

const HEADER_HEIGHT = Platform.OS === 'ios' ? 300 : 320;


const SavedTab = () => {
  return (
    <View style={styles.tabContent}>
      <View style={styles.postContainer}>
        <Text style={styles.noContentText}>Kaydedilen öğe yok</Text>
      </View>
    </View>
  );
};

const TaggedTab = () => {
  return (
    <View style={styles.tabContent}>
      <View style={styles.postContainer}>
        <Text style={styles.noContentText}>Etiketlendiğiniz rota yok</Text>
      </View>
    </View>
  );
};

interface PostsTabProps {
  onRefresh: () => Promise<void>;
  refreshing: boolean;
  routes: RouteWithProfile[];
  isLoading: boolean;
  expandedDescriptions: { [key: string]: boolean };
  onToggleDescription: (routeId: string) => void;
  currentUserId: string | null;
  fetchRoutes: () => Promise<void>;
}

const PostsTab = ({
  onRefresh,
  refreshing,
  routes,
  isLoading,
  expandedDescriptions,
  onToggleDescription,
  currentUserId,
  fetchRoutes
}: PostsTabProps) => {
  if (isLoading || refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
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
          expandedDescriptions={expandedDescriptions}
          onToggleDescription={(routeId) => onToggleDescription(routeId)}
          userId={currentUserId}
          onRefreshRoutes={fetchRoutes}
        />
      </ScrollView>
    </SafeAreaView>
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
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [headerImageUri, setHeaderImageUri] = useState<string | null>(null);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [isHeaderImageViewerVisible, setIsHeaderImageViewerVisible] = useState(false);

  // Check if the current profile belongs to the logged-in user
  const isCurrentUserProfile = currentUserId === profileUserId;
  const [followingsCount, setFollowingsCount] = useState<any>(null);
  const [followersCount, setFollowersCount] = useState<any>(null);

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
  useEffect(() => {

    fetchUser();
    onRefresh();
  }, [route?.params?.userId]);

  const fetchRoutes = async () => {
    if (!profileUserId) return;

    try {
      setIsLoading(true);
      const routes = await RouteModel.getRoutes({

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
      setFollowersCount(followers.length);
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

      await downloadImage(user?.image_url, 'profiles', setImageUri);
      await downloadImage(user?.header_image_url, 'headers', setHeaderImageUri);

      await fetchUser();
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

  const onToggleDescription = useCallback((routeId: string) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [routeId]: !prev[routeId],
    }));
  }, []);

  // Function to download the image
  const downloadImage = async (image_url: string | undefined, bucketName: string, setImageUri: (uri: string | null) => void) => {

    if (!image_url) {
      setImageUri(null);
      return;
    }

    try {
      // If public URL fails, try to download the file
      const { data, error } = await supabase
        .storage
        .from(bucketName)
        .download(`${profileUserId}/${image_url}`);

      if (error) {
        console.error('Supabase download error:', error);
        throw error;
      }

      // Convert Blob to Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUri(reader.result as string);
      };
      reader.readAsDataURL(data);
    } catch (error) {
      console.error('Error in downloadImage:', error);
      // showToast('error', 'Resim yüklenirken bir hata oluştu');
      setImageUri(null);
    } finally {
    }
  };

  // Trigger the function when the component is mounted or image_url changes
  useEffect(() => {
    downloadImage(user?.image_url, 'profiles', setImageUri);
    downloadImage(user?.header_image_url, 'headers', setHeaderImageUri);
  }, [user?.image_url]);

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
        <RouteList
          routes={routes}
          loading={isLoading}
          refreshing={refreshing}
          onRefresh={onRefresh}
          expandedDescriptions={expandedDescriptions}
          onToggleDescription={(routeId) => onToggleDescription(routeId)}
          userId={currentUserId}
          onRefreshRoutes={fetchRoutes}
        />
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

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setUser(updatedProfile);
  };

  console.log('user', user);

  const renderProfileInfo = (user: Profile) => {
    if (!user) return null;

    return (
      <View style={styles.headerTextContainer}>
        <View style={{ flexDirection: 'column', gap: 5 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={styles.headerName}>{user?.full_name || 'Kullanıcı'}</Text>

            <Text style={styles.headerUsername}>@{user?.username || 'kullanici'}</Text>
            {user?.is_verified && <MaterialIcons name="verified" size={16} color="#1DA1F2" />}
          </View>

          {user.description && (
            <Text style={styles.description}>{user.description}</Text>
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
            >
              <Text style={styles.website}>{user.website}</Text>
            </TouchableOpacity>
          )}
        </View>

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
    );
  };

  const renderHeader = (user: Profile) => {
    return (
      <View style={styles.headerContainer}>
        <View style={{ width: '100%' }}>
          <View style={styles.headerImageContainer}>
            <TouchableOpacity
              onPress={() => {
                if (headerImageUri) {
                  setIsHeaderImageViewerVisible(true);
                }
              }}
              disabled={!headerImageUri}>
              <Image
                source={headerImageUri ? { uri: headerImageUri } : undefined}
                style={styles.headerImage}
              />
            </TouchableOpacity>
            <ImageViewer
              images={headerImageUri ? [{ uri: headerImageUri }] : []}
              visible={isHeaderImageViewerVisible}
              onRequestClose={() => setIsHeaderImageViewerVisible(false)}
            />
            <View style={styles.profilePhotoContainer}>
              <TouchableOpacity
                onPress={() => {
                  if (imageUri) {
                    setIsImageViewerVisible(true);
                  }
                }}
                disabled={!imageUri}>

                <Image
                  source={imageUri ? { uri: imageUri } : DefaultAvatar}
                  style={styles.profilePhoto}
                />
              </TouchableOpacity>
            </View>
            <ImageViewer
              images={imageUri ? [{ uri: imageUri }] : []}
              visible={isImageViewerVisible}
              onRequestClose={() => setIsImageViewerVisible(false)}
            />
          </View>

          {/* Only show these buttons for the current user's profile */}
          {isCurrentUserProfile && (
            <View style={styles.headerButtonsContainer}>
              <TouchableOpacity style={styles.headerButton}
                onPress={() => {
                  setUser(user);
                  setIsEditModalVisible(true);

                }}
              >
                <Icon name="pencil" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
                <Icon name="logout" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {renderProfileInfo(user)}




        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{routes.length}</Text>
            <Text style={styles.statLabel}>Rota</Text>
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
            <Text style={styles.statValue}>{followersCount || 0}</Text>
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
            <Text style={styles.statValue}>{followingsCount || 0}</Text>
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
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        {renderHeader(user)}
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: '#000',
            tabBarInactiveTintColor: '#666',
            tabBarIndicatorStyle: { backgroundColor: '#000' },
            tabBarLabelStyle: { fontWeight: '600', textTransform: 'none' },
            tabBarStyle: { backgroundColor: '#fff', elevation: 0, shadowOpacity: 0 },
          }}
        >
          <Tab.Screen
            name="Rotalar"
            options={{
              tabBarShowLabel: false,
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="view-comfortable" size={size} color={color} />
              ),
            }}
            children={() => (
              <PostsTab
                onRefresh={onRefresh}
                refreshing={refreshing}
                routes={routes}
                isLoading={isLoading}
                expandedDescriptions={expandedDescriptions}
                onToggleDescription={onToggleDescription}
                currentUserId={currentUserId}
                fetchRoutes={fetchRoutes}
              />
            )}
          />
          <Tab.Screen
            name="Kaydedilenler"
            options={{
              tabBarShowLabel: false,
              tabBarIcon: ({ color, size }) => (
                <Icon name="bookmark-outline" size={size} color={color} />
              ),
            }}
            component={SavedTab}
          />
          <Tab.Screen
            name="Etiketler"
            options={{
              tabBarShowLabel: false,
              tabBarIcon: ({ color, size }) => (
                <Icon name="tag-outline" size={size} color={color} />
              ),
            }}
            component={TaggedTab}
          />
        </Tab.Navigator>
      </View>
      <GlobalFloatingAction />

      {user && (
        <ProfileEditModal
          visible={isEditModalVisible}
          onClose={() => setIsEditModalVisible(false)}
          profile={user}
          imageUri={imageUri}
          headerImageUri={headerImageUri}
          onUpdate={handleProfileUpdate}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    backgroundColor: '#fff',
    // height: HEADER_HEIGHT,
  },
  headerImageContainer: {
    width: '100%',
    height: 150,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: '#ccc',
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
  headerButtonsContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
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
  headerButton: {
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
  website: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'none',

  },
  profileInfo: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  fullName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  username: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

export default ProfileScreen;
