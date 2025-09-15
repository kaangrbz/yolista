import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
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
import RouteModel from '../model/routes.model';
import { useGlobalAlert } from '../hooks/useGlobalAlert';

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
    updatePostData,
  } = usePostActions(postId, userId, post?.user_id || '');

  const { images, loading: imagesLoading, error: imagesError, currentIndex, handleImageScroll, refreshImages } = useImages(postId, post?.user_id);
  const { showAlert } = useGlobalAlert();

  // Update post actions when post data changes
  useEffect(() => {
    if (post) {
      updatePostData(post);
      // Reset expansion state when post changes
      setIsExpanded(false);
    }
  }, [post?.id, updatePostData]); // Only depend on post.id, not the entire post object

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {return 'şimdi';}
    if (diffInSeconds < 3600) {return `${Math.floor(diffInSeconds / 60)}d`;}
    if (diffInSeconds < 86400) {return `${Math.floor(diffInSeconds / 3600)}s`;}
    return `${Math.floor(diffInSeconds / 86400)}g`;
  };

  const handleProfilePress = () => {
    if (!post?.user_id) {return;}

    if (actions?.onProfilePress) {
      actions.onProfilePress(post.user_id);
    } else {
      (navigation as any).navigate('ProfileMain', {
        userId: post.user_id,
        currentUserId: userId || '',
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

  // Dropdown menu actions
  const handleEditPost = () => {
    Alert.alert(
      'Düzenle',
      'Bu özellik yakında eklenecek',
      [{ text: 'Tamam' }]
    );
  };

  const handleDeletePost = async () => {
    if (!post) {return;}

    Alert.alert(
      'Gönderiyi Sil',
      'Bu gönderiyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data, error } = await RouteModel.deleteRoute(postId);

              if (error) {
                console.error('Error deleting post:', error);
                showAlert('Gönderi silinirken bir hata oluştu');
                return;
              }

              showAlert('Gönderi başarıyla silindi');

              // Navigate back or refresh the feed
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                // Refresh the current screen or navigate to home
                navigation.navigate('HomeStack' as never);
              }
            } catch (error) {
              console.error('Error deleting post:', error);
              showAlert('Gönderi silinirken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const handleReportPost = () => {
    Alert.alert(
      'Şikayet Et',
      'Bu gönderiyi şikayet etmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Şikayet Et',
          style: 'destructive',
          onPress: () => {
            console.log('Post reported:', postId);
            // TODO: Implement report functionality
          },
        },
      ]
    );
  };

  const handleBlockUser = () => {
    if (!post) {return;}
    Alert.alert(
      'Engelle',
      `${post.profiles?.username || 'Bu kullanıcıyı'} engellemek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Engelle',
          style: 'destructive',
          onPress: () => {
            console.log('User blocked:', post.user_id);
            // TODO: Implement block functionality
          },
        },
      ]
    );
  };

  const handleFollowUser = () => {
    if (!post) {return;}
    console.log('Following user:', post.user_id);
    // TODO: Implement follow functionality
    Alert.alert('Takip Edildi', `${post.profiles?.username || 'Kullanıcı'} takip edildi`);
  };

  const handleUnfollowUser = () => {
    if (!post) {return;}
    Alert.alert(
      'Takibi Bırak',
      `${post.profiles?.username || 'Bu kullanıcının'} takibini bırakmak istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Takibi Bırak',
          style: 'destructive',
          onPress: () => {
            console.log('Unfollowed user:', post.user_id);
            // TODO: Implement unfollow functionality
          },
        },
      ]
    );
  };

  const handleCopyLink = () => {
    const link = `https://roulista.com/post/${postId}`;
    // TODO: Implement clipboard functionality
    console.log('Link copied:', link);
    Alert.alert('Link Kopyalandı', 'Gönderi linki panoya kopyalandı');
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
        userId={post.user_id}
        location={post.cities?.name}
        onProfilePress={handleProfilePress}
        isOwnPost={post.user_id === userId}
        isFollowing={false} // TODO: Implement following status
        onMorePress={handleEditPost}
        onReportPress={handleReportPost}
        onBlockPress={handleBlockUser}
        onFollowPress={handleFollowUser}
        onUnfollowPress={handleUnfollowUser}
        onEditPress={handleEditPost}
        onDeletePress={handleDeletePost}
        onSharePress={handleSharePress}
        onCopyLinkPress={handleCopyLink}
      />

      {/* Image Loading State */}
      {imagesLoading && (
        <View style={styles.imageLoadingContainer}>
          <ActivityIndicator size="large" color="#666" />
          {/* <Text style={styles.imageLoadingText}>Resimler yükleniyor...</Text> */}
        </View>
      )}

      {/* Image Error State */}
      {imagesError && !imagesLoading && (
        <View style={styles.imageErrorContainer}>
          <Text style={styles.imageErrorText}>{imagesError}</Text>
          <Text style={styles.imageRetryText} onPress={refreshImages}>
            Tekrar Dene
          </Text>
        </View>
      )}

      {/* Image Carousel */}
      {!imagesLoading && !imagesError && images.length > 0 && (
        <ImageCarousel
          images={images}
          currentIndex={currentIndex}
          onIndexChange={(index) => handleImageScroll({ nativeEvent: { contentOffset: { x: index * 400 } } }, 400)}
          height={400}
          dynamicHeight={true}
          maxHeight={1080}
          minHeight={250}
          onDoubleTap={handleLikePress}
        />
      )}

      {/* No Images State */}
      {!imagesLoading && !imagesError && images.length === 0 && (
        <View style={styles.noImagesContainer}>
          <Text style={styles.noImagesText}>Bu gönderi için resim bulunamadı</Text>
        </View>
      )}

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
        likeCount={likeCount}
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
    marginBottom: 12,
  },
  imageRetryText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  noImagesContainer: {
    height: 300,
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
});

export default UniversalPost;
