import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { PostCaptionProps } from '../../types/post.types';
import { getTimeAgo } from '../../utils/timeAgo';
import { useThemedStyles } from '../../theme/useThemedStyles';

const PostCaption: React.FC<PostCaptionProps> = ({
  username,
  description,
  likeCount,
  commentCount,
  createdAt,
  onComment,
  onLikesPress,
  isExpanded,
  onToggleExpanded,
  hideDescription = false,
  hideCommentPreview = false,
}) => {
  const trimmedDescription = description?.trim() ?? '';

  const styles = useThemedStyles((t) => ({
    container: {
      paddingHorizontal: 12,
    },
    likesText: {
      fontSize: 14,
      fontWeight: '600',
      color: t.textPrimary,
      paddingBottom: 4,
    },
    captionContainer: {
      paddingBottom: 4,
    },
    caption: {
      fontSize: 14,
      color: t.textPrimary,
    },
    username: {
      fontWeight: '600',
    },
    description: {
      fontSize: 14,
      color: t.textPrimary,
      marginTop: 4,
    },
    commentsPreview: {
      paddingBottom: 4,
    },
    commentsText: {
      fontSize: 14,
      color: t.textMuted,
    },
    timeText: {
      fontSize: 12,
      color: t.textMuted,
      paddingBottom: 8,
    },
    seeMoreButton: {
      marginTop: 4,
    },
    seeMoreText: {
      fontSize: 14,
      color: t.textMuted,
      fontWeight: '500',
    },
  }));

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

      <View style={styles.captionContainer}>
        <Text style={styles.caption}>
          <Text style={styles.username}>{username}</Text>
        </Text>
        {trimmedDescription && !hideDescription ? (
          <View>
            <Text
              style={styles.description}
              numberOfLines={isExpanded ? undefined : 3}
            >
              {trimmedDescription}
            </Text>
            {trimmedDescription.length > 140 && (
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
        ) : null}
      </View>

      {!hideCommentPreview ? (
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
      ) : null}

      <Text style={styles.timeText}>{getTimeAgo(createdAt)}</Text>
    </View>
  );
};

export default PostCaption;
