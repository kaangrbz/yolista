import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Animated
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteWithProfile } from '../model/routes.model';
import { supabase } from '../lib/supabase';
import { DefaultAvatar, NoImage } from '../assets';
import { useImages } from '../hooks/useImages';
import { useProfileImageDownload } from '../hooks/useImageDownload';

const { width: screenWidth } = Dimensions.get('window');

interface PostCardProps {
  route: RouteWithProfile;
  userId: string | null;
  onLike?: (routeId: string, isLiked: boolean) => void;
  onComment?: (routeId: string) => void;
  onShare?: (routeId: string) => void;
  onSave?: (routeId: string) => void;
  onProfilePress?: (userId: string) => void;
  showFullScreen?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({
  route,
  userId,
  onLike,
  onComment,
  onShare,
  onSave,
  onProfilePress,
  showFullScreen = false
}) => {
  const [localLikeCount, setLocalLikeCount] = useState(route.like_count || 0);
  const [localDidLike, setLocalDidLike] = useState(route.did_like || false);
  
  // Double tap animation
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  // Use the new useImages hook for real images
  const { 
    images, 
    loading: imagesLoading, 
    error: imagesError, 
    currentIndex: currentImageIndex, 
    handleImageScroll, 
    goToImage 
  } = useImages(route.id || '', route.user_id);

  // Use profile image download hook for profile image
  const { imageUri: profileImageUri } = useProfileImageDownload(
    route.profiles?.image_url, 
    route.user_id || ''
  );

  // Images are now handled by useImages hook

  const handleLike = () => {
    if (!userId || !route.id) return;
    
    setLocalLikeCount(prev => localDidLike ? prev - 1 : prev + 1);
    setLocalDidLike(prev => !prev);
    onLike?.(route.id, !localDidLike);
  };

  const lastTap = useRef<number>(0);
  const doubleTapDelay = 300; // milliseconds

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < doubleTapDelay) {
      // Double tap detected
      if (!localDidLike) {
        handleLike();
        showHeartAnimation();
      }
    }
    lastTap.current = now;
  };

  const showHeartAnimation = () => {
    // Reset animation values
    heartScale.setValue(0);
    heartOpacity.setValue(1);

    // Animate heart
    Animated.parallel([
      Animated.timing(heartScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(heartOpacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'şimdi';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}d`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}s`;
    return `${Math.floor(diffInSeconds / 86400)}g`;
  };

  // Loading is now handled by useImages hook

  return (
    <View style={[styles.container, showFullScreen && styles.fullScreen]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => onProfilePress?.(route.user_id || '')}
        >
          <Image 
            source={profileImageUri ? { uri: profileImageUri } : DefaultAvatar}
            style={styles.profileImage}
            resizeMode="cover"
          />
          <View style={styles.userDetails}>
            <Text style={styles.username}>{route.profiles?.username || 'unknown'}</Text>
            <Text style={styles.location}>{route.cities?.name}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreButton}>
          <Icon name="dots-horizontal" size={24} color="#262626" />
        </TouchableOpacity>
      </View>

      {/* Image Carousel */}
      <View style={styles.imageContainer}>
        {/* Loading State */}
        {imagesLoading && (
          <View style={styles.imageLoadingContainer}>
            <ActivityIndicator size="large" color="#666" />
            {/* <Text style={styles.imageLoadingText}>Resimler yükleniyor...</Text> */}
          </View>
        )}

        {/* Error State */}
        {imagesError && !imagesLoading && (
          <View style={styles.imageErrorContainer}>
            <Text style={styles.imageErrorText}>{imagesError}</Text>
          </View>
        )}

        {/* Images */}
        {!imagesLoading && !imagesError && images.length > 0 && (
          <>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => handleImageScroll(event, screenWidth)}
              style={styles.imageScrollView}
            >
              {images.map((imageUri, index) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={1}
                  hitSlop={20}
                  onPress={handleDoubleTap}
                  style={styles.imageTouchable}
                >
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.postImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Image Indicators */}
            {images.length > 1 && (
              <View style={styles.imageIndicators}>
                {images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicator,
                      index === currentImageIndex && styles.activeIndicator
                    ]}
                  />
                ))}
              </View>
            )}

            {/* Heart Animation */}
            <Animated.View
              style={[
                styles.heartAnimation,
                {
                  opacity: heartOpacity,
                  transform: [{ scale: heartScale }],
                },
              ]}
              pointerEvents="none"
            >
              <Icon name="heart" size={80} color="#ed4956" />
            </Animated.View>
          </>
        )}

        {/* No Images State */}
        {!imagesLoading && !imagesError && images.length === 0 && (
          <View style={styles.noImagesContainer}>
            <Text style={styles.noImagesText}>Bu gönderi için resim bulunamadı</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
            <Icon 
              name={localDidLike ? "heart" : "heart-outline"} 
              size={24} 
              color={localDidLike ? "#ed4956" : "#262626"} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => onComment?.(route.id || '')} 
            style={styles.actionButton}
          >
            <Icon name="comment-outline" size={24} color="#262626" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => onShare?.(route.id || '')} 
            style={styles.actionButton}
          >
            <Icon name="send" size={24} color="#262626" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          onPress={() => onSave?.(route.id || '')} 
          style={styles.actionButton}
        >
          <Icon name="bookmark-outline" size={24} color="#262626" />
        </TouchableOpacity>
      </View>

      {/* Likes Count */}
      <View style={styles.likesContainer}>
        <Text style={styles.likesText}>
          {localLikeCount} beğeni
        </Text>
      </View>

      {/* Caption */}
      <View style={styles.captionContainer}>
        <Text style={styles.caption}>
          <Text style={styles.username}>{route.profiles?.username || 'unknown'}</Text>
          {' '}
          <Text style={styles.captionText}>{route.title}</Text>
        </Text>
        {route.description && (
          <Text style={styles.description}>{route.description}</Text>
        )}
      </View>

      {/* Comments Preview */}
      <TouchableOpacity 
        style={styles.commentsPreview}
        onPress={() => onComment?.(route.id || '')}
      >
        <Text style={styles.commentsText}>
          {route.comment_count || 0} yorumun tümünü gör
        </Text>
      </TouchableOpacity>

      {/* Time */}
      <Text style={styles.timeText}>
        {formatTimeAgo(route.created_at || new Date().toISOString())}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 1,
  },
  fullScreen: {
    flex: 1,
  },
  loadingContainer: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  location: {
    fontSize: 12,
    color: '#8e8e8e',
  },
  moreButton: {
    padding: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  imageScrollView: {
    height: 400,
  },
  postImage: {
    width: screenWidth,
    height: 400,
  },
  imageIndicators: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 2,
  },
  activeIndicator: {
    backgroundColor: '#fff',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginRight: 12,
  },
  likesContainer: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  likesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  captionContainer: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  caption: {
    fontSize: 14,
    color: '#262626',
  },
  captionText: {
    fontWeight: '400',
  },
  description: {
    fontSize: 14,
    color: '#262626',
    marginTop: 4,
  },
  commentsPreview: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  commentsText: {
    fontSize: 14,
    color: '#8e8e8e',
  },
  timeText: {
    fontSize: 12,
    color: '#8e8e8e',
    paddingHorizontal: 12,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  imageLoadingContainer: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  imageLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  imageErrorContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  imageErrorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  noImagesContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  noImagesText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  imageTouchable: {
    width: screenWidth,
    height: '100%',
  },
  heartAnimation: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -40,
    marginLeft: -40,
    zIndex: 1000,
  },
});

export default PostCard;
