import React, { useState, useEffect } from 'react';
import { View, Image, TextInput, TouchableOpacity, StyleSheet, Text, FlatList, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../lib/supabase';
import CommentModel, { Comment } from '../model/comment.model';
import { showToast } from '../utils/alert';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import Seperator from './Seperator';
import { DefaultAvatar } from '../assets';
import { getTimeAgo } from '../utils/timeAgo';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import KeyboardAwareContainer from './common/KeyboardAwareContainer';

type RootStackParamList = {
  ProfileMain: { userId: string };
  CommentSection: { routeId: string; parentType: 'routeDetail' | 'homePage'; routeOwnerId: string };
};

type CommentSectionNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface CommentSectionProps {
  imageUrl?: string;
  parentType: 'routeDetail' | 'homePage';
  routeId?: string;
}

interface CommentItemProps {
  item: Comment;
  navigation: CommentSectionNavigationProp;
}

const CommentItem: React.FC<CommentItemProps> = ({ item, navigation }) => {
  const [authorImageUrl, setAuthorImageUrl] = useState<string | null>(null);
  const [loadingAuthorImage, setLoadingAuthorImage] = useState(false);

  useEffect(() => {
    const downloadAuthorImage = async () => {
      if (!item.profiles?.image_url) {
        setAuthorImageUrl(null);
        return;
      }

      setLoadingAuthorImage(true);
      try {
        const { data, error } = await supabase
          .storage
          .from('profiles')
          .download(`${item.user_id}/${item.profiles.image_url}`);

        console.log('data', data);

        if (error) {throw error;}

        const reader = new FileReader();
        reader.onloadend = () => {
          setAuthorImageUrl(reader.result as string);
        };
        reader.readAsDataURL(data);
      } catch (error) {
        console.error('Error downloading author image:', error);
        setAuthorImageUrl(null);
      } finally {
        setLoadingAuthorImage(false);
      }
    };

    downloadAuthorImage();
  }, [item.profiles?.image_url]);

  return (
    <View style={styles.commentItem}>
      <View style={styles.commentImageContainer}>
      {loadingAuthorImage ? (
        <ActivityIndicator size="small" color="#121212" />
      ) : (
        <Image
          source={authorImageUrl ? { uri: authorImageUrl } : DefaultAvatar}
          style={styles.commentAuthorImage}
        />
      )}
      </View>
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <TouchableOpacity style={styles.commentAuthorContainer} onPress={() => navigation.navigate('ProfileMain', { userId: item.user_id })}>
            <Text style={styles.commentAuthor}>{item.profiles?.username}</Text>

            <Seperator />
            {item.profiles?.is_verified && (
              <>
                <Icon name="check-decagram" size={16} color="#1DA1F2" style={styles.verifiedIcon} />
                <Seperator />
              </>
            )}

            <Text style={styles.commentTime}>
              {getTimeAgo(item.created_at)}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.commentText}>{item.content}</Text>
      </View>
    </View>
  );
};

export const CommentSection: React.FC<CommentSectionProps> = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'CommentSection'>>();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [routeId, setRouteId] = useState<string | null>(route.params?.routeId || null);
  const [parentType, setParentType] = useState<string | null>(route.params?.parentType || null);
  const [routeOwnerId, setRouteOwnerId] = useState<string | null>(route.params?.routeOwnerId || null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const navigation = useNavigation<CommentSectionNavigationProp>();



  const MAX_CHARACTERS = 280;

  console.log('routeId', routeId);
  console.log('parentType', parentType);

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);

          // Get user profile to get avatar
          const { data: profile } = await supabase
            .from('profiles')
            .select('image_url')
            .eq('id', user.id)
            .single();

          if (profile?.image_url) {
            setUserAvatar(profile.image_url);
          }
        }

        // Fetch comments
        if (routeId) {
          const fetchedComments = await CommentModel.getRouteComments(routeId);
          setComments(fetchedComments);
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        showToast('error', 'Veriler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [routeId]);

  const handleCommentChange = (text: string) => {
    setCommentText(text);
  };

  const handleAddComment = async () => {
    console.log('Send button pressed');
    console.log('Current state:', {
      commentText: commentText,
      currentUser: currentUser?.id,
      submitting,
      routeId,
      textLength: commentText.length,
    });

    if (!commentText.trim() || !currentUser?.id || submitting || !routeId || commentText.length > MAX_CHARACTERS) {
      console.log('Button press rejected due to:', {
        emptyText: !commentText.trim(),
        noUser: !currentUser?.id,
        isSubmitting: submitting,
        noRouteId: !routeId,
        tooLong: commentText.length > MAX_CHARACTERS,
      });
      return;
    }

    setSubmitting(true);
    try {
      console.log('Starting comment submission');
      // Simulate API delay and fake upload
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create a temporary comment for optimistic update
      const tempComment: Comment = {
        id: `temp-${Date.now()}`,
        route_id: routeId,
        user_id: currentUser.id,
        content: commentText.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profiles: {
          username: currentUser.email?.split('@')[0] || 'user',
          image_url: userAvatar || undefined,
          full_name: currentUser.email?.split('@')[0] || 'user',
        },
      };

      console.log('Adding temporary comment');
      // Optimistically add the comment to the list
      setComments(prevComments => [tempComment, ...prevComments]);
      setCommentText('');

      console.log('Sending to database');
      // Actually send to database
      const newComment = await CommentModel.addRouteComment(route.params.routeId, currentUser.id, commentText.trim(), routeOwnerId || '');
      console.log('Database response:', newComment);

      // Get the full comment with profile data
      const { data: fullComment } = await supabase
        .from('comments')
        .select('*, profiles(username, image_url, full_name)')
        .eq('id', newComment.id)
        .single();

      console.log('Full comment data:', fullComment);
      // Replace temporary comment with real one
      setComments(prevComments =>
        prevComments.map(comment =>
          comment.id === tempComment.id ? (fullComment as Comment) : comment
        )
      );

      // showToast('success', 'Yorum başarıyla eklendi');
    } catch (error) {
      console.error('Error adding comment:', error);
      showToast('error', 'Yorum eklenirken bir hata oluştu');

      // Remove temporary comment on error
      setComments(prevComments =>
        prevComments.filter(comment => !comment.id.startsWith('temp-'))
      );
    } finally {
      setSubmitting(false);
    }
  };

 // Function to download the image
 const downloadImage = async (image_url: string | undefined) => {
  console.log('Downloading image_url:', image_url);

  if (!image_url) {
    setImageUrl(null);
    setLoadingImage(false);
    return;
  }

  setLoading(true);
  try {
    // If public URL fails, try to download the file
    const filepath = `${currentUser?.id}/${image_url}`;

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
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(data);
  } catch (error) {
    console.log('Error in downloadImage:', error);
    // showToast('error', 'Resim yüklenirken bir hata oluştu');
    setImageUrl(null);
  } finally {
    setLoading(false);
    setTimeout(() => setLoadingImage(false), 100);
  }
};
  useEffect(() => {
    if (currentUser?.id) {
      downloadImage(currentUser?.image_url);
    }
  }, [currentUser?.id]);

  const renderCommentItem = ({ item }: { item: Comment }) => (
    <CommentItem item={item} navigation={navigation} />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#121212" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Comments list */}
      <Text style={styles.commentsTitle}>Yorumlar</Text>
      {comments.length > 0 ? (
        <FlatList
          data={comments}
          renderItem={renderCommentItem}
          keyExtractor={(item) => item.id}
          style={styles.commentsList}
        />
      ) : (
        <View style={styles.emptyCommentsContainer}>
          <Text style={styles.emptyCommentsText}>Henüz yorum yok</Text>
        </View>
      )}

      {/* Comment input - KeyboardAware wrapper for input section */}
      <KeyboardAwareContainer
        enableScrollView={false}
        style={[
          styles.commentInputContainer,
          parentType === 'homePage' && styles.homePageCommentContainer,
          parentType === 'routeDetail' && styles.routeDetailCommentContainer,
        ]}
      >
        <TextInput
          placeholder="Yorum yap"
          placeholderTextColor="#666"
          style={styles.commentInput}
          value={commentText}
          onChangeText={handleCommentChange}
          multiline
        />
        <Text style={[
          styles.characterCount,
          commentText.length > MAX_CHARACTERS && styles.characterCountWarning,
        ]}>
          {commentText.length}/{MAX_CHARACTERS}
        </Text>
        <TouchableOpacity
          onPress={handleAddComment}
          disabled={submitting || !commentText.trim() || commentText.length > MAX_CHARACTERS}
          style={[styles.sendButton, (!commentText.trim() || commentText.length > MAX_CHARACTERS) && styles.disabledSendButton]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Icon name="send" size={16} color={commentText.trim() ? '#fff' : '#999'} />
          )}
        </TouchableOpacity>
      </KeyboardAwareContainer>
    </View>
  );
};

export default CommentSection;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  commentInputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  commentInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 24,
    fontSize: 15,
    maxHeight: 100,
    backgroundColor: '#f8f8f8',
  },
  homePageCommentContainer: {
    padding: 12,
  },
  routeDetailCommentContainer: {
    padding: 16,
  },
  commentsList: {
    flex: 1,
    padding: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentImageContainer: {
    width: 33,
    height: 33,
    borderRadius: 22,
    marginRight: 12,
  },
  commentAuthorImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  commentContent: {
    flex: 1,
    fontSize: 13,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    alignItems: 'center',
  },
  commentAuthor: {
    fontWeight: '600',
    fontSize: 14,
    color: '#1a1a1a',
  },
  commentTime: {
    fontSize: 13,
    color: '#888',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
  },
  emptyCommentsContainer: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCommentsText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
  },
  sendButton: {
    backgroundColor: '#1DA1F2',
    width: 30,
    height: 30,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1DA1F2',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledSendButton: {
    backgroundColor: '#e0e0e0',
    shadowOpacity: 0,
  },
  characterCount: {
    position: 'absolute',
    right: 50,
    bottom: 10,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 13,
    color: '#888',
    paddingHorizontal: 5,
    paddingVertical: 5,
    borderRadius: 10,
    zIndex: 1000,
  },
  characterCountWarning: {
    color: '#ff3b30',
    fontWeight: '500',
  },
  commentAuthorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  username: {
    fontSize: 13,
    color: '#888',
  },
  verifiedIcon: {
    marginHorizontal: 4,
  },
});
