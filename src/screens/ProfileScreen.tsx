import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { Tabs } from 'react-native-collapsible-tab-view';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useCityStore, CityState } from '../store/cityStore';

const { width } = Dimensions.get('window');

interface ProfilePageProps {
  userId: string;
  currentUserId: string;
}

const HEADER_HEIGHT = 300;

// Tab Content Components
const PostsTab = () => {
  return (
    <Tabs.ScrollView>
      <View style={styles.tabContent}>
        <View style={styles.postContainer}>
          <Text style={styles.noContentText}>Henüz gönderi yok</Text>
        </View>
      </View>
    </Tabs.ScrollView>
  );
};

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

const ProfileScreen = ({ userId, currentUserId }: ProfilePageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const selectedCity = useCityStore((state: CityState) => state.selectedCityName);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

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
          <TouchableOpacity style={styles.profileSettingContainer}>
            <Icon name="cog" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileEditContainer}>
            <Icon name="pencil" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerName}>
            Kaan Gürbüz <MaterialIcons name="verified" size={16} color="#1DA1F2" />
          </Text>
          
          <View style={styles.row}>
            <Text style={styles.headerUsername}>@kaangurbuz</Text>
            <Text style={styles.headerUsername}>{selectedCity}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>120</Text>
            <Text style={styles.statLabel}>Gönderi</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>458</Text>
            <Text style={styles.statLabel}>Takipçi</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>285</Text>
            <Text style={styles.statLabel}>Takip</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
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
