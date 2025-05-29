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

const { width } = Dimensions.get('window');

interface ProfilePageProps {
  userId: string;
  currentUserId: string;
}

const HEADER_HEIGHT = 300;


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

const ProfileScreen = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [routes, setRoutes] = useState<RouteWithProfile[]>([]);
    const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: string]: boolean }>({});
    const [userId, setUserId] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [followers, setFollowers] = useState<any>(null);
    const [followings, setFollowings] = useState<any>(null);
    const navigation = useNavigation();
    const selectedCityId = useCityStore((state: CityState) => state.selectedCityId);
  
    useEffect(() => {
      const fetchUserId = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setUser(user);
            setUserId(user.id);
                      }
        } catch (error) {
          console.error('Error fetching user ID:', error);
        }
      };
  
      onRefresh();
    }, []);

  const fetchRoutes = async () => {
    try {
      setIsLoading(true);
      const routes = await RouteModel.getRoutes({ limit: 20, onlyMain: true, userId: userId || undefined });
      setRoutes(routes);
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowers = async () => {
    try {
      setIsLoading(true);
      const followers = await UserModel.getFollowers(userId || '');
      setFollowers(followers);
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowings = async () => {
    try {
      setIsLoading(true);
      const followings = await UserModel.getFollowings(userId || '');
      setFollowings(followings);
    } catch (error) {
      console.error('Error fetching followings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
    // fetchFollowers();
    // fetchFollowings();
  }, [userId]);


  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      // fetchRoutes will now use the correct selectedCityId from component scope
      await fetchRoutes();
      // await fetchFollowers();
      // await fetchFollowings();

      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error('Error refreshing routes:', error);
      showToast('error', 'Rotalar yenilenirken bir hata oluştu');
      setRefreshing(false);
    }
  }, [userId]);

    const onRoutePress = useCallback((routeId: string) => {
      navigate(navigation, PageName.RouteDetail, { routeId });
    }, [navigation]); 

    const onToggleDescription = useCallback((routeId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [routeId]: !prev[routeId],
    }));
  }, []);

  // Tab Content Components
  const PostsTab = () => {
    return (
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
          userId={userId}
          onRefreshRoutes={fetchRoutes}
        />
      </Tabs.ScrollView>
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

  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <View style={{ width: '100%' }}>
          <View style={styles.headerImageContainer}>
            <Image
              source={{ uri: 'https://picsum.photos/800/300' }}
              style={styles.headerImage}
            />
            <View style={styles.profilePhotoContainer}>
              <Image
                source={{ uri: 'https://picsum.photos/200' }}
                style={styles.profilePhoto}
              />
            </View>
          </View>
          <TouchableOpacity style={styles.logoutContainer} onPress={handleLogout}>
            <Icon name="logout" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileSettingContainer}>
            <Icon name="cog" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileEditContainer}>
            <Icon name="pencil" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerName}>
            Test <MaterialIcons name="verified" size={16} color="#1DA1F2" />
          </Text>

          <View style={styles.row}>
            <Text style={styles.headerUsername}>@test</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{routes.length}</Text>
            <Text style={styles.statLabel}>Gönderi</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Takipçi</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Takip</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading || refreshing) {
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
    right: 100,
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
    fontSize: 12,
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
