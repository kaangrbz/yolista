import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PostCaptionProps } from '../../types/post.types';
import { getTimeAgo } from '../../utils/timeAgo';

const PostCaption: React.FC<PostCaptionProps> = ({
  username,
  title,
  description,
  likeCount,
  commentCount,
  createdAt,
  onComment,
  onLikesPress,
  isExpanded,
  onToggleExpanded,
}) => {

  return (
    <View style={styles.container}>
      {likeCount > 0 && (
        onLikesPress ? (
          <TouchableOpacity
            onPress={onLikesPress}
            activeOpacity={0.65}
            accessibilityRole="button"
            accessibilityLabel={`${likeCount} beğeni, listeyi aç`}
          >
            <Text style={styles.likesText}>
              {likeCount} beğeni
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.likesText}>
            {likeCount} beğeni
          </Text>
        )
      )}

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

      <TouchableOpacity
        style={styles.commentsPreview}
        onPress={onComment}
        activeOpacity={0.65}
        accessibilityRole="button"
        accessibilityLabel={
          commentCount > 0
            ? `${commentCount} yorum, tümünü gör`
            : 'İlk yorumu sen yap'
        }
      >
        <Text style={styles.commentsText}>
          {commentCount > 0
            ? `${commentCount} yorumun tümünü gör`
            : 'İlk yorumu sen ol'}
        </Text>
      </TouchableOpacity>

      {/* Time */}
      <Text style={styles.timeText}>{getTimeAgo(createdAt)}</Text>
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
