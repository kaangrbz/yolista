import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PostActionsProps } from '../../types/post.types';

const PostActions: React.FC<PostActionsProps> = ({
  isLiked,
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
            name={isLiked ? "heart" : "heart-outline"} 
            size={24} 
            color={isLiked ? "#ed4956" : "#262626"} 
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={onComment} style={styles.actionButton}>
          <Icon name="comment-outline" size={24} color="#262626" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onShare} style={styles.actionButton}>
          <Icon name="send" size={24} color="#262626" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onSave} style={styles.actionButton}>
        <Icon name="bookmark-outline" size={24} color="#262626" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
});

export default PostActions;
