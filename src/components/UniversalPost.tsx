import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePost } from '../hooks/usePost';
import { usePostActions } from '../hooks/usePostActions';
import { useImages } from '../hooks/useImages';
import PostHeader from './post/PostHeader';
import ImageCarousel from './post/ImageCarousel';
import PostActions from './post/PostActions';
import PostCaption from './post/PostCaption';
import ShareModal from './ShareModal';
import { PostProps } from '../types/post.types';

const UniversalPost: React.FC<PostProps> = ({
  postId,
  userId,
  showFullScreen = false,
  actions,
}) => {
  const navigation = useNavigation();
  const { post, loading, error } = usePost(postId, userId);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const { 
    isLiked, 
    likeCount, 
    commentCount, 
    handleLike, 
    handleComment, 
    handleShare, 
    handleSave,
    updatePostData 
  } = usePostActions(postId, userId, post?.user_id || '');
  
  const { images, currentIndex, handleImageScroll } = useImages(postId);

  // Update post actions when post data changes
  useEffect(() => {
    if (post) {
      updatePostData(post);
      // Reset expansion state when post changes
      setIsExpanded(false);
    }
  }, [post, updatePostData]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'şimdi';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}d`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}s`;
    return `${Math.floor(diffInSeconds / 86400)}g`;
  };

  const handleProfilePress = () => {
    if (!post?.user_id) return;
    
    if (actions?.onProfilePress) {
      actions.onProfilePress(post.user_id);
    } else {
      (navigation as any).navigate('ProfileMain', { 
        userId: post.user_id, 
        currentUserId: userId || '' 
      });
    }
  };

  const handleCommentPress = () => {
    if (actions?.onComment) {
      actions.onComment(postId);
    } else {
      (navigation as any).navigate('CommentSection', { 
        routeId: postId,
        parentType: 'routeDetail',
        routeOwnerId: post?.user_id || '',
      });
    }
  };

  const handleLikePress = () => {
    if (actions?.onLike) {
      actions.onLike(postId, !isLiked);
    } else {
      handleLike();
    }
  };

  const handleSharePress = () => {
    if (actions?.onShare) {
      actions.onShare(postId);
    } else {
      setIsShareModalVisible(true);
    }
  };

  const handleSavePress = () => {
    if (actions?.onSave) {
      actions.onSave(postId);
    } else {
      handleSave();
    }
  };

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0095f6" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Gönderi bulunamadı'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PostHeader
        username={post.profiles?.username || 'unknown'}
        userImage={post.profiles?.image_url}
        location={post.cities?.name}
        onProfilePress={handleProfilePress}
      />

      <ImageCarousel
        images={images}
        currentIndex={currentIndex}
        onIndexChange={(index) => handleImageScroll({ nativeEvent: { contentOffset: { x: index * 400 } } }, 400)}
        height={400}
      />

      <PostActions
        isLiked={isLiked}
        likeCount={likeCount}
        commentCount={commentCount}
        onLike={handleLikePress}
        onComment={handleCommentPress}
        onShare={handleSharePress}
        onSave={handleSavePress}
      />

      <PostCaption
        username={post.profiles?.username || 'unknown'}
        title={post.title}
        description={post.description}
        commentCount={commentCount}
        timeAgo={formatTimeAgo(post.created_at)}
        onComment={handleCommentPress}
        isExpanded={isExpanded}
        onToggleExpanded={handleToggleExpanded}
      />

      {/* Share Modal */}
      <ShareModal
        visible={isShareModalVisible}
        onClose={() => setIsShareModalVisible(false)}
        postId={postId}
        postTitle={post.title}
        postImage={images[0]}
        postUrl={`https://roulista.com/post/${postId}`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 1,
  },
  loadingContainer: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
});

export default UniversalPost;