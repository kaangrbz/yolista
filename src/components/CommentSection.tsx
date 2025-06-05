import React, { useState, useEffect } from 'react';
import { View, Image, TextInput, TouchableOpacity, StyleSheet, Text, FlatList, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../lib/supabase';
import CommentModel, { CommentWithProfile } from '../model/comment.model';
import { showToast } from '../utils/alert';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  commentInputContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
  },
  commentImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  commentInput: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 12,
    fontSize: 14,
    maxHeight: 100,
  },
  homePageCommentContainer: {
    padding: 8,
  },
  routeDetailCommentContainer: {
    padding: 12,
  },
  bookmarkDetailCommentContainer: {
    padding: 12,
  },
  homePageCommentImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  routeDetailCommentImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  bookmarkDetailCommentImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentsList: {
    flex: 1,
    padding: 12,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  commentAuthorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthor: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  commentTime: {
    fontSize: 12,
    color: '#888',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCommentsContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCommentsText: {
    fontSize: 14,
    color: '#888',
  },
  sendButton: {
    backgroundColor: '#1DA1F2',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledSendButton: {
    backgroundColor: '#e0e0e0',
  },
});

interface CommentSectionProps {
  imageUrl?: string;
  parentType: 'routeDetail' | 'bookmarkDetail' | 'homePage';
  routeId?: string;
  bookmarkId?: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ 
  imageUrl, 
  parentType, 
  routeId, 
  bookmarkId 
}) => {
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    // Get current user
    const fetchUser = async () => {
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
    };
    
    fetchUser();
    fetchComments();
  }, [routeId, bookmarkId]);

  const fetchComments = async () => {
    if (!routeId && !bookmarkId) return;
    
    setLoading(true);
    try {
      let fetchedComments: CommentWithProfile[] = [];
      
      if (routeId) {
        fetchedComments = await CommentModel.getRouteComments(routeId);
      } else if (bookmarkId) {
        fetchedComments = await CommentModel.getBookmarkComments(bookmarkId);
      }
      
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      showToast('error', 'Yorumlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !currentUser?.id || submitting) return;
    if (!routeId && !bookmarkId) {
      showToast('error', 'Yorum eklemek için geçerli bir içerik gerekli');
      return;
    }
    
    setSubmitting(true);
    try {
      if (routeId) {
        await CommentModel.addRouteComment(routeId, currentUser.id, commentText.trim());
      } else if (bookmarkId) {
        await CommentModel.addBookmarkComment(bookmarkId, currentUser.id, commentText.trim());
      }
      
      setCommentText('');
      showToast('success', 'Yorum başarıyla eklendi');
      fetchComments(); // Refresh comments
    } catch (error) {
      console.error('Error adding comment:', error);
      showToast('error', 'Yorum eklenirken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const renderCommentItem = ({ item }: { item: CommentWithProfile }) => (
    <View style={styles.commentItem}>
      <Image 
        source={{ uri: item.profiles?.image_url || 'https://picsum.photos/40/40' }}
        style={styles.commentAuthorImage}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{item.profiles?.full_name || item.profiles?.username}</Text>
          <Text style={styles.commentTime}>
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: tr })}
          </Text>
        </View>
        <Text style={styles.commentText}>{item.content}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Comments list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#000" />
        </View>
      ) : comments.length > 0 ? (
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
      
      {/* Comment input */}
      <View style={[
        styles.commentInputContainer,
        parentType === 'homePage' && styles.homePageCommentContainer,
        parentType === 'routeDetail' && styles.routeDetailCommentContainer,
        parentType === 'bookmarkDetail' && styles.bookmarkDetailCommentContainer,
      ]}>
        <Image
          source={{
            uri: userAvatar || imageUrl || `https://picsum.photos/40/40`,
          }}
          style={[
            styles.commentImage,
            parentType === 'homePage' && styles.homePageCommentImage,
            parentType === 'routeDetail' && styles.routeDetailCommentImage,
            parentType === 'bookmarkDetail' && styles.bookmarkDetailCommentImage,
          ]}
        />
        <TextInput
          placeholder="Yorum yap"
          placeholderTextColor="#666"
          style={styles.commentInput}
          value={commentText}
          onChangeText={setCommentText}
          multiline
        />
        <TouchableOpacity 
          onPress={handleAddComment}
          disabled={submitting || !commentText.trim()}
          style={[styles.sendButton, !commentText.trim() && styles.disabledSendButton]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Icon name="send" size={16} color={commentText.trim() ? "#fff" : "#999"} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CommentSection;