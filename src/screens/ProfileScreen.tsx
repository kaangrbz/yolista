import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Switch,
  FlatList,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// --- TypeScript Interfaces ---
export interface Route {
  id: string;
  name: string;
  thumbnail: string;
  isDraft?: boolean; // Only for owned routes
  likes?: number;
}

export interface ProfileData {
  id: string;
  name: string;
  bio: string;
  profilePhoto: string;
  followers: number;
  following: number;
  likedRoutesCount: number;
  createdRoutesCount: number;
  isVerified?: boolean;
  mutualConnections?: number; // Only for others' profiles
  draftRoutesCount?: number; // Only for own profile
  createdRoutes: Route[];
  likedRoutes: Route[];
  savedRoutes: Route[];
  socialMediaLinks?: {
    instagram?: string;
    twitter?: string;
    website?: string;
  };
  privacySettings?: {
    showEmail?: boolean;
    showPhone?: boolean;
  };
}

export interface ProfilePageProps {
  userId: string; // The ID of the user whose profile is being viewed
  currentUserId: string; // The ID of the currently logged-in user
  onFollow?: (profileId: string) => void;
  onMessage?: (profileId: string) => void;
  onEditProfile?: (profileData: ProfileData) => Promise<void>;
  onReportBlock?: (profileId: string, action: 'report' | 'block') => void;
  // Add other handlers for navigation, e.g., onViewStatsList, onRoutePress
}

// --- Sample Data ---
// This would typically come from an API
export const sampleOwnProfileData: ProfileData = {
  id: 'user123',
  name: 'TrailBlazer Explorer',
  bio: 'Passionate hiker, photographer, and route creator. Exploring the world one trail at a time!',
  profilePhoto: 'https://picsum.photos/200/300?random=1', // Placeholder
  followers: 1234,
  following: 567,
  likedRoutesCount: 890,
  createdRoutesCount: 45,
  draftRoutesCount: 5,
  createdRoutes: [
    { id: 'cr1', name: 'Mountain Peak Ascent', thumbnail: 'https://picsum.photos/150/150?random=11', likes: 230 },
    { id: 'cr2', name: 'Forest River Trail', thumbnail: 'https://picsum.photos/150/150?random=12', likes: 180 },
    { id: 'cr3', name: 'City Park Loop (Draft)', thumbnail: 'https://picsum.photos/150/150?random=13', isDraft: true },
    { id: 'cr4', name: 'Coastal Scenic Drive', thumbnail: 'https://picsum.photos/150/150?random=14', likes: 310 },
    { id: 'cr5', name: 'Desert Oasis Walk', thumbnail: 'https://picsum.photos/150/150?random=15', likes: 90 },
  ],
  likedRoutes: [
    { id: 'lr1', name: 'Grand Canyon Rim', thumbnail: 'https://picsum.photos/150/150?random=21', likes: 1500 },
    { id: 'lr2', name: 'Swiss Alps Traverse', thumbnail: 'https://picsum.photos/150/150?random=22', likes: 2100 },
    { id: 'lr3', name: 'Patagonia Peaks', thumbnail: 'https://picsum.photos/150/150?random=23', likes: 1800 },
  ],
  savedRoutes: [
    { id: 'sr1', name: 'Yellowstone Geysers', thumbnail: 'https://picsum.photos/150/150?random=31' },
    { id: 'sr2', name: 'Alaska Wilderness', thumbnail: 'https://picsum.photos/150/150?random=32' },
  ],
  socialMediaLinks: {
    instagram: 'https://instagram.com/trailblazer_explorer',
    twitter: 'https://twitter.com/t_explorer',
  },
  privacySettings: {
    showEmail: true,
  },
};

export const sampleOtherProfileData: ProfileData = {
  id: 'user456',
  name: 'Wanderlust Hiker',
  bio: 'Adventure seeker, always looking for the next challenging climb.',
  profilePhoto: 'https://picsum.photos/200/300?random=2', // Placeholder
  followers: 987,
  following: 123,
  likedRoutesCount: 456,
  createdRoutesCount: 78,
  isVerified: true,
  mutualConnections: 12,
  createdRoutes: [
    { id: 'ocr1', name: 'Himalayan Base Camp', thumbnail: 'https://picsum.photos/150/150?random=41', likes: 500 },
    { id: 'ocr2', name: 'Andes Mountain Pass', thumbnail: 'https://picsum.photos/150/150?random=42', likes: 400 },
    { id: 'ocr3', name: 'Rocky Mountain High', thumbnail: 'https://picsum.photos/150/150?random=43', likes: 300 },
  ],
  likedRoutes: [
    { id: 'olr1', name: 'Swiss National Park', thumbnail: 'https://picsum.photos/150/150?random=51', likes: 1200 },
    { id: 'olr2', name: 'Dolomites Via Ferrata', thumbnail: 'https://picsum.photos/150/150?random=52', likes: 1000 },
  ],
  savedRoutes: [], // Others usually don't expose saved routes
};


// --- Helper Components ---
const RouteCard: React.FC<{ route: Route; isOwnProfile: boolean; onEditRoute?: (routeId: string) => void }> = ({
  route,
  isOwnProfile,
  onEditRoute,
}) => (
  <Pressable style={styles.routeCard} accessibilityLabel={`View route: ${route.name}`}>
    <Image source={{ uri: route.thumbnail }} style={styles.routeThumbnail} />
    {route.isDraft && isOwnProfile && (
      <View style={styles.draftBadge}>
        <Text style={styles.draftBadgeText}>Draft</Text>
      </View>
    )}
    <Text style={styles.routeName} numberOfLines={1}>{route.name}</Text>
    {!route.isDraft && route.likes !== undefined && (
        <View style={styles.routeStats}>
            <Icon name="heart" size={12} color="gray" />
            <Text style={styles.routeLikes}>{route.likes}</Text>
        </View>
    )}
    {isOwnProfile && !route.isDraft && ( // Only show edit for non-draft own routes
        <Pressable
            style={styles.editRouteButton}
            onPress={() => onEditRoute && onEditRoute(route.id)}
            accessibilityLabel={`Edit route ${route.name}`}
        >
            <Icon name="pencil" size={16} color="white" />
        </Pressable>
    )}
  </Pressable>
);

// --- Main ProfilePage Component ---
const ProfilePage: React.FC<ProfilePageProps> = ({
  userId,
  currentUserId,
  onFollow,
  onMessage,
  onEditProfile,
  onReportBlock,
}) => {
  const isOwnProfile = userId === currentUserId;
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'created' | 'liked' | 'saved'>('created');
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [tempProfilePhoto, setTempProfilePhoto] = useState('');
  const [tempName, setTempName] = useState('');
  const [tempBio, setTempBio] = useState('');
  const [tempShowEmail, setTempShowEmail] = useState(false); // For privacy setting
  const [isFollowing, setIsFollowing] = useState(false); // Dummy state for follow button

  // Simulate data fetching
  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      try {
        // In a real app, you'd make an API call here based on userId
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        if (isOwnProfile) {
          setProfileData(sampleOwnProfileData);
          setTempProfilePhoto(sampleOwnProfileData.profilePhoto);
          setTempName(sampleOwnProfileData.name);
          setTempBio(sampleOwnProfileData.bio);
          setTempShowEmail(sampleOwnProfileData.privacySettings?.showEmail || false);
        } else {
          setProfileData(sampleOtherProfileData);
          // Simulate if the current user is already following this profile
          setIsFollowing(false); // Default to not following, could be fetched from API
        }
      } catch (err) {
        setError('Failed to load profile.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [userId, isOwnProfile]); // Re-fetch if userId or profile type changes

  const handleRefresh = async () => {
    // Re-fetch data on pull-to-refresh
    setLoading(true); // Indicate refreshing
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate fetch delay
    if (isOwnProfile) {
      setProfileData({ ...sampleOwnProfileData, followers: sampleOwnProfileData.followers + 10 }); // Simulate data change
    } else {
      setProfileData({ ...sampleOtherProfileData, followers: sampleOtherProfileData.followers + 5 });
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!profileData) return;

    const updatedProfile: ProfileData = {
      ...profileData,
      profilePhoto: tempProfilePhoto,
      name: tempName,
      bio: tempBio,
      privacySettings: {
        ...profileData.privacySettings,
        showEmail: tempShowEmail,
      },
    };

    try {
      // Simulate API call to update profile
      setLoading(true); // Show loading, potentially within the modal
      await onEditProfile?.(updatedProfile); // Call the prop function for actual update logic
      setProfileData(updatedProfile); // Update local state after successful "API" call
      setIsEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile.');
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRoute = (routeId: string) => {
    console.log(`Editing route: ${routeId}`);
    // In a real app, you'd navigate to a route editor screen or open another modal
  };

  const renderRouteItem = ({ item }: { item: Route }) => (
    <RouteCard route={item} isOwnProfile={isOwnProfile} onEditRoute={isOwnProfile ? handleEditRoute : undefined} />
  );

  // Show full screen loader on initial data fetch
  if (loading && !profileData) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // Display error if data fetch failed
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={() => {/* Re-fetch data or navigate back */}} accessibilityLabel="Retry loading profile">
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  // Handle case where profile data is null after loading (e.g., user not found)
  if (!profileData) {
    return (
        <View style={styles.centered}>
            <Text style={styles.errorText}>Profile not found.</Text>
        </View>
    );
  }

  // Determine which routes to display based on the active tab
  const displayedRoutes =
    activeTab === 'created'
      ? profileData.createdRoutes
      : activeTab === 'liked'
      ? profileData.likedRoutes
      : profileData.savedRoutes;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor="#007AFF" />
      }
    >
      {/* Profile Header Section */}
      <View style={styles.header}>
        <View style={styles.profilePhotoContainer}>
          <Image source={{ uri: profileData.profilePhoto }} style={styles.profilePhoto} />
        </View>
        <Text style={styles.profileName}>{profileData.name}</Text>
        <Text style={styles.profileBio}>{profileData.bio}</Text>

        {isOwnProfile ? (
          <View style={styles.ownProfileHeaderActions}>
            <Pressable
              onPress={() => setIsEditModalVisible(true)}
              style={({ pressed }) => [styles.headerActionButton, pressed && styles.pressed]}
              accessibilityLabel="Edit profile"
            >
              <Icon name="pencil" size={24} color="white" />
            </Pressable>
            <Pressable
              onPress={() => console.log('Settings pressed')}
              style={({ pressed }) => [styles.headerActionButton, pressed && styles.pressed]}
              accessibilityLabel="Account settings"
            >
              <Icon name="cog-outline" size={24} color="white" />
            </Pressable>
          </View>
        ) : (
          <View style={styles.otherProfileHeaderActions}>
            <Pressable
                onPress={() => {
                    setIsFollowing(!isFollowing); // Toggle dummy follow state
                    onFollow && onFollow(userId); // Call prop handler
                }}
                style={({ pressed }) => [styles.followButton, isFollowing && styles.followingButton, pressed && styles.pressed]}
                accessibilityLabel={isFollowing ? "Unfollow" : "Follow"}
            >
                <Text style={isFollowing ? styles.followingButtonText : styles.followButtonText}>
                    {isFollowing ? 'Following' : 'Follow'}
                </Text>
            </Pressable>
            <Pressable
              onPress={() => onMessage && onMessage(userId)}
              style={({ pressed }) => [styles.messageButton, pressed && styles.pressed]}
              accessibilityLabel="Message user"
            >
              <Text style={styles.messageButtonText}>Message</Text>
            </Pressable>
            {profileData.isVerified && (
              <Icon name="verified" size={20} color="#007AFF" style={styles.verifiedBadge} accessibilityLabel="Verified profile" />
            )}
          </View>
        )}
      </View>

      {/* Interactive Stats Bar */}
      <View style={styles.statsBar}>
        <Pressable style={styles.statBubble} onPress={() => console.log('Followers clicked')} accessibilityLabel="View followers">
          <Text style={styles.statNumber}>{profileData.followers}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </Pressable>
        <Pressable style={styles.statBubble} onPress={() => console.log('Following clicked')} accessibilityLabel="View following">
          <Text style={styles.statNumber}>{profileData.following}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </Pressable>
        <Pressable style={styles.statBubble} onPress={() => console.log('Liked Routes clicked')} accessibilityLabel="View liked routes">
          <Text style={styles.statNumber}>{profileData.likedRoutesCount}</Text>
          <Text style={styles.statLabel}>Liked Routes</Text>
        </Pressable>
        <Pressable style={styles.statBubble} onPress={() => console.log('Created Routes clicked')} accessibilityLabel="View created routes">
          <Text style={styles.statNumber}>{profileData.createdRoutesCount}</Text>
          <Text style={styles.statLabel}>Created Routes</Text>
          {isOwnProfile && profileData.draftRoutesCount && profileData.draftRoutesCount > 0 && (
            <View style={styles.draftCountBadge}>
              <Text style={styles.draftCountBadgeText}>{profileData.draftRoutesCount}</Text>
            </View>
          )}
          {!isOwnProfile && profileData.mutualConnections && profileData.mutualConnections > 0 && (
            <View style={styles.mutualConnectionsBadge}>
              <Text style={styles.mutualConnectionsBadgeText}>{profileData.mutualConnections} mutual</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Profile Action Area */}
      <View style={styles.actionArea}>
        {isOwnProfile ? (
          <>
            <Pressable
              style={styles.fullWidthButton}
              onPress={() => setIsEditModalVisible(true)}
              accessibilityLabel="Edit your profile"
            >
              <Text style={styles.fullWidthButtonText}>Edit Profile</Text>
            </Pressable>
            <View style={styles.actionRow}>
              <Pressable style={styles.compactButton} onPress={() => console.log('Share Profile')} accessibilityLabel="Share your profile">
                <Icon name="share-2" size={18} color="#007AFF" />
                <Text style={styles.compactButtonText}>Share Profile</Text>
              </Pressable>
              <Pressable style={styles.compactButton} onPress={() => console.log('Account Settings')} accessibilityLabel="Go to account settings">
                <Icon name="cog-outline" size={18} color="#007AFF" />
                <Text style={styles.compactButtonText}>Account Settings</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.actionRow}>
            <Pressable
                onPress={() => {
                    setIsFollowing(!isFollowing); // Toggle follow state
                    onFollow && onFollow(userId);
                }}
                style={({ pressed }) => [styles.compactButton, styles.followCompactButton, isFollowing && styles.followingCompactButton, pressed && styles.pressed]}
                accessibilityLabel={isFollowing ? "Unfollow" : "Follow"}
            >
                <Text style={isFollowing ? styles.followingCompactButtonText : styles.followCompactButtonText}>
                    {isFollowing ? 'Following' : 'Follow'}
                </Text>
            </Pressable>
            <Pressable style={styles.compactButton} onPress={() => onMessage && onMessage(userId)} accessibilityLabel="Message user">
              <Icon name="chatbubble-outline" size={18} color="#007AFF" />
              <Text style={styles.compactButtonText}>Message</Text>
            </Pressable>
            <Pressable
              style={styles.compactButton}
              onPress={() => Alert.alert('Options', 'Report or Block user?', [
                { text: 'Report', onPress: () => onReportBlock && onReportBlock(userId, 'report') },
                { text: 'Block', onPress: () => onReportBlock && onReportBlock(userId, 'block') },
                { text: 'Cancel', style: 'cancel' },
              ])}
              accessibilityLabel="More options for this profile, such as report or block"
            >
              <Icon name="dots-vertical" size={18} color="#007AFF" />
              <Text style={styles.compactButtonText}>More</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Routes Section */}
      <View style={styles.routesSection}>
        <View style={styles.tabNavigation}>
          <Pressable
            style={[styles.tabButton, activeTab === 'created' && styles.activeTab]}
            onPress={() => setActiveTab('created')}
            accessibilityLabel="Show created routes"
          >
            <Text style={[styles.tabButtonText, activeTab === 'created' && styles.activeTabText]}>Created Routes</Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, activeTab === 'liked' && styles.activeTab]}
            onPress={() => setActiveTab('liked')}
            accessibilityLabel="Show liked routes"
          >
            <Text style={[styles.tabButtonText, activeTab === 'liked' && styles.activeTabText]}>Liked Routes</Text>
          </Pressable>
          {isOwnProfile && (
            <Pressable
              style={[styles.tabButton, activeTab === 'saved' && styles.activeTab]}
              onPress={() => setActiveTab('saved')}
              accessibilityLabel="Show saved routes"
            >
              <Text style={[styles.tabButtonText, activeTab === 'saved' && styles.activeTabText]}>Saved</Text>
            </Pressable>
          )}
        </View>

        <FlatList
          // Prepend 'Create New' card for own profile's 'Created Routes' tab
          data={activeTab === 'created' && isOwnProfile ? [{ id: 'createNew', name: 'Create New', thumbnail: '', isCreateNew: true }, ...displayedRoutes] : displayedRoutes}
          renderItem={({ item }) => {
            if ('isCreateNew' in item && item.isCreateNew && isOwnProfile && activeTab === 'created') {
                return (
                    <Pressable style={styles.createNewCard} onPress={() => console.log('Create new route')} accessibilityLabel="Create a new route">
                        <Icon name="plus-circle-outline" size={60} color="#ccc" />
                        <Text style={styles.createNewCardText}>Create New</Text>
                    </Pressable>
                );
            }
            return renderRouteItem({ item: item as Route });
          }}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.routesGrid}
          scrollEnabled={false} // Prevent inner FlatList scroll from conflicting with outer ScrollView
        />
      </View>

      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => {
          setIsEditModalVisible(!isEditModalVisible);
          // Reset temp states on close if not saved to avoid stale data in next open
          if(profileData) {
              setTempProfilePhoto(profileData.profilePhoto);
              setTempName(profileData.name);
              setTempBio(profileData.bio);
              setTempShowEmail(profileData.privacySettings?.showEmail || false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <Pressable onPress={() => setIsEditModalVisible(false)} accessibilityLabel="Close edit profile modal">
                <Icon name="close-circle-outline" size={30} color="#666" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollViewContent}>
                {/* Profile Photo Upload */}
                <Pressable onPress={() => console.log('Change photo')} style={styles.editPhotoContainer} accessibilityLabel="Change profile photo">
                    <Image
                        source={{ uri: tempProfilePhoto || 'https://picsum.photos/200/300?random=0' }} // Fallback
                        style={styles.editProfilePhoto}
                    />
                    <View style={styles.cameraIconOverlay}>
                        <Icon name="camera" size={24} color="white" />
                    </View>
                </Pressable>

                {/* Name Input */}
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                    style={styles.input}
                    value={tempName}
                    onChangeText={setTempName}
                    placeholder="Your Name"
                    accessibilityLabel="Profile name input"
                />

                {/* Bio Input */}
                <Text style={styles.inputLabel}>Bio</Text>
                <TextInput
                    style={styles.input}
                    value={tempBio}
                    onChangeText={setTempBio}
                    placeholder="Tell us about yourself"
                    multiline
                    numberOfLines={4}
                    maxLength={150}
                    accessibilityLabel="Profile bio input"
                />

                {/* Social Media Links - Placeholder (Read-only in this example) */}
                <Text style={styles.sectionTitle}>Social Media Links</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Instagram URL"
                    value={profileData?.socialMediaLinks?.instagram}
                    editable={false} // For simplicity, these are read-only here
                    accessibilityLabel="Instagram link (read-only in this example)"
                />
                {/* Add more for Twitter, Website etc. if needed */}

                {/* Privacy Settings */}
                <Text style={styles.sectionTitle}>Privacy Settings</Text>
                <View style={styles.privacyToggle}>
                    <Text style={styles.privacyToggleText}>Show Email</Text>
                    <Switch
                        value={tempShowEmail}
                        onValueChange={setTempShowEmail}
                        trackColor={{ false: '#767577', true: '#81b0ff' }}
                        thumbColor={tempShowEmail ? '#f5dd4b' : '#f4f3f4'}
                        accessibilityLabel="Toggle visibility of email address"
                    />
                </View>
                {/* Add more privacy settings as needed */}

            </ScrollView>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsEditModalVisible(false)}
                accessibilityLabel="Cancel profile edit"
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveProfile}
                accessibilityLabel="Save profile changes"
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default ProfilePage;

// --- Styling ---
const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2; // (Screen width - total horizontal padding 15*2 - columnGap 10) / 2 columns approx

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Header Section
  header: {
    alignItems: 'center',
    paddingBottom: 20,
    paddingTop: 40, // For status bar (adjust as needed based on SafeAreaView)
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  profilePhotoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#fff', // Fallback
    overflow: 'hidden',
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  profileName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  profileBio: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginHorizontal: 20,
    marginTop: 5,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  ownProfileHeaderActions: {
    position: 'absolute',
    top: 50,
    right: 15,
    flexDirection: 'row',
    gap: 10,
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 20,
  },
  pressed: {
    opacity: 0.7, // Subtle hover/press animation
  },
  otherProfileHeaderActions: {
    flexDirection: 'row',
    marginTop: 15,
    alignItems: 'center',
    gap: 10,
  },
  followButton: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  followButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  followingButton: {
    backgroundColor: '#E0E0E0',
    borderColor: '#999',
    borderWidth: 1,
  },
  followingButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  messageButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  messageButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  verifiedBadge: {
    marginLeft: 5,
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginTop: -30, // Overlap with header for a sleek look
    borderRadius: 15,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  statBubble: {
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  draftCountBadge: {
    position: 'absolute',
    top: -5,
    right: 5,
    backgroundColor: 'red',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  draftCountBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  mutualConnectionsBadge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mutualConnectionsBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Action Area
  actionArea: {
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 20,
  },
  fullWidthButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  fullWidthButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
  compactButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  compactButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  followCompactButton: {
      backgroundColor: '#007AFF',
  },
  followCompactButtonText: {
      color: 'white',
  },
  followingCompactButton: {
      backgroundColor: '#E0E0E0',
      borderColor: '#999',
      borderWidth: 1,
  },
  followingCompactButtonText: {
      color: '#333',
  },

  // Routes Section
  routesSection: {
    paddingHorizontal: 15,
    marginTop: 10,
  },
  tabNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  activeTabText: {
    color: 'white',
  },
  routesGrid: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  routeCard: {
    width: ITEM_WIDTH,
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  routeThumbnail: {
    width: '100%',
    height: ITEM_WIDTH * 0.8, // Aspect ratio
    backgroundColor: '#eee',
  },
  routeName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    marginHorizontal: 10,
    color: '#333',
  },
  routeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginBottom: 8,
    marginTop: 4,
  },
  routeLikes: {
    marginLeft: 4,
    fontSize: 12,
    color: 'gray',
  },
  draftBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFC107',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  draftBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  editRouteButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 6,
    borderRadius: 15,
  },
  createNewCard: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.2, // Make it slightly taller to fit text comfortably
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#eee',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  createNewCardText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#aaa',
  },

  // Modal Styling
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    height: '80%', // Adjust as needed
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  modalScrollViewContent: {
      paddingBottom: 20, // Give some space at the bottom for scroll
  },
  editPhotoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 20,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  editProfilePhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    padding: 6,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
      marginTop: 20,
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      paddingBottom: 5,
  },
  privacyToggle: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
      paddingVertical: 8,
  },
  privacyToggleText: {
      fontSize: 16,
      color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

// --- Example App.tsx to use this component ---
/*
import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import ProfilePage, { ProfilePageProps, ProfileData } from './ProfilePage'; // Make sure path is correct

export default function App() {
  // Dummy functions for demonstration
  const handleFollow = (profileId: string) => {
    console.log(`User followed: ${profileId}`);
    // Implement API call to follow
  };

  const handleMessage = (profileId: string) => {
    console.log(`Message user: ${profileId}`);
    // Navigate to chat screen
  };

  const handleEditProfile = async (updatedData: ProfileData) => {
    console.log('Attempting to save profile:', updatedData);
    // Simulate API call success/failure
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          console.log('Profile saved successfully (simulated)');
          resolve();
        } else {
          console.error('Failed to save profile (simulated)');
          reject(new Error('Network error or invalid data'));
        }
      }, 1500);
    });
  };

  const handleReportBlock = (profileId: string, action: 'report' | 'block') => {
    console.log(`${action} user: ${profileId}`);
    // Implement API call to report/block
  };

  // Scenario 1: Viewing your own profile
  const ownProfileProps: ProfilePageProps = {
    userId: 'user123',        // The ID of the profile being viewed
    currentUserId: 'user123', // Your logged-in user ID
    onFollow: handleFollow,
    onMessage: handleMessage,
    onEditProfile: handleEditProfile,
    onReportBlock: handleReportBlock,
  };

  // Scenario 2: Viewing someone else's profile
  const otherProfileProps: ProfilePageProps = {
    userId: 'user456',        // The ID of the profile being viewed
    currentUserId: 'user123', // Your logged-in user ID
    onFollow: handleFollow,
    onMessage: handleMessage,
    onEditProfile: handleEditProfile, // This won't be called for other's profile, but good practice to pass
    onReportBlock: handleReportBlock,
  };

  // Choose which profile to display by uncommenting one:
  const activeProfileProps = ownProfileProps;
  // const activeProfileProps = otherProfileProps;

  return (
    <SafeAreaView style={appStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#192f6a" />
      <ProfilePage {...activeProfileProps} />
    </SafeAreaView>
  );
}

const appStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
});
*/