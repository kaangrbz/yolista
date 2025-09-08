import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PostCaptionProps } from '../../types/post.types';

const PostCaption: React.FC<PostCaptionProps> = ({
  username,
  title,
  description,
  commentCount,
  timeAgo,
  onComment,
  isExpanded,
  onToggleExpanded,
}) => {
  return (
    <View style={styles.container}>
      {/* Likes Count */}
      {/* <Text style={styles.likesText}>
      </Text> */}

      {/* Caption */}
      <View style={styles.captionContainer}>
        <Text style={styles.caption}>
          <Text style={styles.username}>{username}</Text>
          {' '}
          <Text style={styles.captionText}>{title}</Text>
        </Text>
        {description && (
          <View>
            <Text 
              style={styles.description}
              numberOfLines={isExpanded ? undefined : 3}
            >
              {description}
            </Text>
            {description.length > 140 && (
              <TouchableOpacity 
                style={styles.seeMoreButton} 
                onPress={onToggleExpanded}
              >
                <Text style={styles.seeMoreText}>
                  {isExpanded ? 'daha az' : 'daha fazla'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Comments Preview */}
      {commentCount > 0 && (
        <TouchableOpacity style={styles.commentsPreview} onPress={onComment}>
          <Text style={styles.commentsText}>
            {commentCount} yorumun tümünü gör
          </Text>
        </TouchableOpacity>
      )}

      {/* Time */}
      <Text style={styles.timeText}>{timeAgo}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
  },
  likesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
    paddingBottom: 4,
  },
  captionContainer: {
    paddingBottom: 4,
  },
  caption: {
    fontSize: 14,
    color: '#262626',
  },
  username: {
    fontWeight: '600',
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
    paddingBottom: 4,
  },
  commentsText: {
    fontSize: 14,
    color: '#8e8e8e',
  },
  timeText: {
    fontSize: 12,
    color: '#8e8e8e',
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  seeMoreButton: {
    marginTop: 4,
  },
  seeMoreText: {
    fontSize: 14,
    color: '#8e8e8e',
    fontWeight: '500',
  },
});

export default PostCaption;
