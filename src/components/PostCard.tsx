import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteWithProfile } from '../model/routes.model';
import { supabase } from '../lib/supabase';
import { DefaultAvatar, NoImage } from '../assets';

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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [localLikeCount, setLocalLikeCount] = useState(route.like_count || 0);
  const [localDidLike, setLocalDidLike] = useState(route.did_like || false);

  // Mock images for demonstration (10 adede kadar)
  const mockImages = [
    'https://picsum.photos/400/600?random=' + Math.round(Math.random() * 1000),
    'https://picsum.photos/400/600?random=' + Math.round(Math.random() * 1000),
    'https://picsum.photos/400/600?random=' + Math.round(Math.random() * 1000),
    'https://picsum.photos/400/600?random=' + Math.round(Math.random() * 1000),
    'https://picsum.photos/400/600?random=' + Math.round(Math.random() * 1000),
  ];

  useEffect(() => {
    // Simulate loading images
    setLoading(true);
    setTimeout(() => {
      setImages(mockImages);
      setLoading(false);
    }, 500);
  }, [route.id]);

  const handleImageScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / screenWidth);
    setCurrentImageIndex(index);
  };

  const handleLike = () => {
    if (!userId || !route.id) return;
    
    setLocalLikeCount(prev => localDidLike ? prev - 1 : prev + 1);
    setLocalDidLike(prev => !prev);
    onLike?.(route.id, !localDidLike);
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

  if (loading) {
    return (
      <View style={[styles.container, showFullScreen && styles.fullScreen]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0095f6" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, showFullScreen && styles.fullScreen]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => onProfilePress?.(route.user_id || '')}
        >
          <Image 
            source={route.profiles?.image_url ? { uri: route.profiles.image_url } : DefaultAvatar}
            style={styles.profileImage}
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
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleImageScroll}
          style={styles.imageScrollView}
        >
          {images.map((imageUri, index) => (
            <Image
              key={index}
              source={{ uri: imageUri }}
              style={styles.postImage}
              resizeMode="cover"
            />
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
});

export default PostCard;
