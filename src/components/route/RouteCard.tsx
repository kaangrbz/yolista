import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AuthorInfo from '../AuthorInfo';
import RouteModel, { RouteWithProfile } from '../../model/routes.model';
import { navigate, PageName } from '../../types/navigation';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Seperator from '../Seperator';
import { DefaultAvatar, NoImage } from '../../assets';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/alert';
import ImageViewer from '../ImageViewer';

// Define the navigation param list type
type RootStackParamList = {
  HomeMain: undefined;
  RouteDetail: { routeId: string };
  AddCategory: undefined;
  Explore: { categoryId?: number };
  ProfileMain: { userId: string; currentUserId: string };
  Followers: { userId: string };
  Following: { userId: string };
  ExploreMain: { categoryId?: number };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface RouteCardProps {
  route: RouteWithProfile;
  userId: string | null;
  onRefresh: () => void;
  expandedDescriptions: { [key: string]: boolean };
  onToggleDescription: (routeId: string) => void;
  showAuthorHeader?: boolean;
  showConnectingLine?: boolean;
  isLastItem?: boolean;
}

const RouteCard: React.FC<RouteCardProps> = ({
  route,
  userId,
  onRefresh,
  expandedDescriptions,
  onToggleDescription,
  showAuthorHeader = true,
  showConnectingLine = true,
  isLastItem = false,
}) => {
  const routeKey = String(route.id ?? '');
  const isMainRoute = route.order_index === 0;
  const [isExpanded, setIsExpanded] = useState(expandedDescriptions[routeKey] || false);
  const [localLikeCount, setLocalLikeCount] = useState(route.like_count || 0);
  const [localDidLike, setLocalDidLike] = useState(route.did_like || false);
  const navigation = useNavigation<NavigationProp>();
  const currentRoute = useRoute();
  const isExploreScreen = currentRoute.name === 'ExploreMain';
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingImage, setLoadingImage] = useState(true);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);

  // Handle text layout if needed
  const handleTextLayout = (e: any, key: string) => {
    // Implementation if needed
  };

  // Ensure we have valid values for required props
  const safeFullName = route.profiles?.full_name || 'Unknown User';
  const safeUsername = route.profiles?.username || 'unknown';
  const safeCreatedAt = route.created_at || new Date().toISOString();
  const safeAuthorId = route.user_id || '';
  const safeRouteId = route.id || ''; // Ensure we have a valid route ID

  // Function to download the image
  const downloadImage = async (image_url: string | undefined) => {
    setLoadingImage(true);

    console.log('Downloading image_url:', image_url);

    if (!image_url) {
      setImageUri(null);
      setLoadingImage(false);
      return;
    }

    setLoading(true);
    try {
      // If public URL fails, try to download the file
      const filepath = `${route.user_id}/${image_url}`;

      const { data, error } = await supabase
        .storage
        .from('routes')
        .download(filepath);

      if (error) {
        console.log('Supabase download error:', error);
        throw error;
      }

      // Convert Blob to Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUri(reader.result as string);
      };
      reader.readAsDataURL(data);
    } catch (error) {
      console.log('Error in downloadImage:', error);
      // showToast('error', 'Resim yüklenirken bir hata oluştu');
      setImageUri(null);
    } finally {
      setLoading(false);
      setTimeout(() => setLoadingImage(false), 100);
    }
  };

  // Trigger the function when the component is mounted or image_url changes
  useEffect(() => {
    downloadImage(route.image_url);
  }, [route.image_url]);

  // Generate random size for explore items
  const getRandomSize = () => {
    const sizes = ['normal', 'doubleWidth', 'doubleHeight'];
    return sizes[Math.floor(Math.random() * sizes.length)];
  };

  if (isExploreScreen) {
    return (
      <TouchableOpacity
        style={styles.exploreCard}
        onPress={() => navigation.navigate('RouteDetail', { routeId: route.id || '' })}
      >
        <TouchableOpacity
          style={styles.exploreImageContainer}
          onPress={() => {
            navigation.navigate('RouteDetail', { routeId: route.id || '' });
          }}
        >
          {loadingImage ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#333" />
            </View>
          ) : imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.exploreImage}
              resizeMode="cover"
            />
          ) : (
            <Image
              source={NoImage}
              style={styles.exploreImage}
              resizeMode="cover"
            />
          )}
          <View style={styles.exploreOverlay}>
            <View style={styles.likeContainer}>
              <Icon name={localDidLike ? "heart" : "heart-outline"} size={16} color="#fff" />
              <Text style={styles.likeCount}>{localLikeCount}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.cardContainer, (showConnectingLine && !isMainRoute) && styles.withConnectingLine]}>
      {showConnectingLine && (
        <View style={[styles.connectingLine, isLastItem && styles.connectingLineLast]} />
      )}
      <TouchableOpacity
        style={styles.routeCard}
        onPress={() => navigation.navigate('RouteDetail', { routeId: route.id || '' })}
        disabled={!isMainRoute}
      >
        {showAuthorHeader && (
          <AuthorInfo
            fullName={safeFullName}
            image_url={route.profiles?.image_url}
            isVerified={route.profiles?.is_verified || false}
            username={safeUsername}
            createdAt={safeCreatedAt}
            authorId={safeAuthorId}
            callback={onRefresh}
            loggedUserId={userId}
            routeId={safeRouteId}
            cityName={route.cities?.name || ''}
          />
        )}

        <TouchableOpacity
          style={styles.imageContainer}
          onPress={() => {
            if (imageUri) {
              setIsImageViewerVisible(true);
            }
          }}
          disabled={!imageUri}
        >
          {loadingImage ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#333" />
            </View>
          ) : imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.routeImage}
              resizeMode="cover"
            />
          ) : (
            <Image
              source={NoImage}
              style={styles.routeImage}
              resizeMode="cover"
            />
          )}
        </TouchableOpacity>

        <View style={styles.routeInfo}>
          <View style={{ padding: 16 }}>
            <Text style={styles.routeTitle}>{route.title}</Text>

            {/* Category and city should be hidden for not main routes */}
            <View style={[styles.row, !isMainRoute && { display: 'none' }, { paddingBottom: 4 }]}>
              {route.categories?.name && (
                <>
                  <TouchableOpacity
                    style={[styles.row, styles.categoryContainer]}
                    onPress={(e) => {
                      e.stopPropagation();
                      console.log('Category tapped:', route.categories?.name);
                      navigation.navigate('Explore', { categoryId: route.category_id });
                    }}
                    activeOpacity={0.7}
                  >
                    <Icon name={route.categories?.icon_name} size={18} color="#666" />
                    <Text style={styles.routeCategory}>
                      {route.categories?.name}
                    </Text>
                  </TouchableOpacity>
                  <Seperator />
                </>
              )}

              {route.cities?.name && (
                <View style={styles.cityContainer}>
                  <Icon name="map-marker" size={16} color="#666" />
                  <Text style={styles.cityName}>{route.cities?.name}</Text>
                </View>
              )}
            </View>
            {route.description && (
              <>
                <Text
                  style={styles.routeDescription}
                  numberOfLines={isExpanded ? undefined : 3}
                  onTextLayout={e => handleTextLayout(e, routeKey)}
                >
                  {route.description}
                </Text>
                {route.description?.length > 140 && (
                  <TouchableOpacity style={styles.seeMoreText} onPress={() => {
                    setIsExpanded(!isExpanded);
                  }}>
                    <Text
                      style={styles.seeMoreText}
                    >
                      {isExpanded ? 'daha az' : 'daha fazla'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            <View style={styles.reactionContainer}>
              <TouchableOpacity style={styles.reactionItem}>
                <Icon name="comment-outline" size={18} color="#121" />
                <Text style={styles.reactionText}>{0}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.reactionItem} onPress={async () => {
                if (!userId || !route.id) return;

                // Optimistically update UI
                setLocalLikeCount(prev => localDidLike ? prev - 1 : prev + 1);
                setLocalDidLike(prev => !prev);

                const result = localDidLike
                  ? await RouteModel.unlikeRoute(route.id, userId)
                  : await RouteModel.likeRoute(route.id, route.user_id || '', userId);

                if (!result.success) {
                  // Revert on failure
                  setLocalLikeCount(prev => localDidLike ? prev + 1 : prev - 1);
                  setLocalDidLike(prev => !prev);
                }
              }}>
                <Icon name={localDidLike ? "heart" : "heart-outline"} size={18} color="#c00" />
                <Text style={styles.reactionText}>{localLikeCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.reactionItem}>
                <Icon name="eye-outline" size={18} color="#121" />
                <Text style={styles.reactionText}>{0}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.reactionItem}>
                <Icon name="bookmark-outline" size={18} color="#121" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.reactionItem}>
                <Icon name="share-variant" size={18} color="#121" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.commentInputContainer}>
            <Image
              source={DefaultAvatar}
              style={styles.commentImage}
            />
            <TextInput
              placeholder="Yorum yap"
              placeholderTextColor="#666"
              style={styles.commentInput}
            />
            <TouchableOpacity>
              <Icon name="send" size={20} color="#121" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      <ImageViewer
        images={imageUri ? [{ uri: imageUri }] : []}
        visible={isImageViewerVisible}
        onRequestClose={() => setIsImageViewerVisible(false)}
      />
    </View>
  );
};

const CONNECTING_LINE_WIDTH = 2;
const CONNECTING_LINE_COLOR = '#e1e8ed';

const styles = StyleSheet.create({
  cardContainer: {
    position: 'relative',
    minHeight: 400,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryContainer: {
    alignSelf: 'flex-start',
  },
  withConnectingLine: {
    paddingLeft: 16,
  },
  connectingLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: CONNECTING_LINE_WIDTH,
    backgroundColor: CONNECTING_LINE_COLOR,
  },
  connectingLineLast: {
    height: 24, // Adjust this value based on your design
  },
  routeCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
  },
  routeInfo: {
    paddingBottom: 0,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#121212',
  },
  routeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginTop: 4,
    lineHeight: 20,
  },
  routeCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginTop: 4,
  },

  cityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cityName: {
    fontSize: 13,
    color: '#333',
  },
  seeMoreText: {
    color: '#007AFF',
    fontSize: 14,
    marginBottom: 4,
  },
  reactionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionText: {
    marginLeft: 4,
    color: '#666',
  },
  commentContainer: {
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  commentImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  commentInput: {
    flex: 1,
    padding: 0,
    margin: 0,
    fontSize: 14,
    color: '#121212',
  },
  routeImage: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Explore screen specific styles
  exploreCard: {
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
    height: '100%',
  },
  exploreImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
  },
  exploreImage: {
    width: '100%',
    height: '100%',
  },
  exploreOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  likeCount: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  exploreInfo: {
    padding: 8,
  },
  exploreTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#121212',
    marginBottom: 4,
  },
  exploreDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
});

export default RouteCard;
