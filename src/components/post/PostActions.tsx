import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PostActionsProps } from '../../types/post.types';

const PostActions: React.FC<PostActionsProps> = ({
  isLiked,
  isSaved = false,
  isSaveLoading = false,
  likeCount,
  commentCount,
  onLike,
  onComment,
  onShare,
  onSave,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftActions}>
        <TouchableOpacity onPress={onLike} style={styles.actionButton}>
          <Icon
            name={isLiked ? 'heart' : 'heart-outline'}
            size={24}
            color={isLiked ? '#ed4956' : '#262626'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onComment}
          style={styles.actionButton}
          accessibilityLabel={
            commentCount > 0 ? `${commentCount} yorum` : 'Yorum yap'
          }
        >
          <Icon name="comment-outline" size={24} color="#262626" />
          {commentCount > 0 && (
            <Text style={styles.actionCountText}>{commentCount}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={onShare} style={styles.actionButton}>
          <Icon name="send" size={24} color="#262626" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onSave} style={styles.actionButton} disabled={isSaveLoading}>
        {isSaveLoading ? (
          <ActivityIndicator size="small" color="#262626" />
        ) : (
          <Icon name={isSaved ? 'bookmark' : 'bookmark-outline'} size={24} color="#262626" />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // paddingHorizontal: 0,
    // paddingTop: 0,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 2,
  },
  actionCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#262626',
    minWidth: 12,
  },
});

export default PostActions;
