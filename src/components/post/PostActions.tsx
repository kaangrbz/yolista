import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PostActionsProps } from '../../types/post.types';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';

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
  variant = 'default',
}) => {
  const theme = useAppTheme();
  const iconColor = theme.textPrimary;
  const isCompact = variant === 'compact';
  const iconSize = isCompact ? 20 : 24;

  const styles = useThemedStyles((t) => ({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: isCompact ? 8 : 0,
    },
    leftActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: isCompact ? 6 : 8,
      gap: 2,
    },
    actionCountText: {
      fontSize: isCompact ? 11 : 13,
      fontWeight: '600',
      color: t.textPrimary,
      minWidth: 12,
    },
  }));

  return (
    <View style={styles.container}>
      <View style={styles.leftActions}>
        <TouchableOpacity onPress={onLike} style={styles.actionButton}>
          <Icon
            name={isLiked ? 'heart' : 'heart-outline'}
            size={iconSize}
            color={isLiked ? '#ed4956' : iconColor}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onComment}
          style={styles.actionButton}
          accessibilityLabel={
            commentCount > 0 ? `${commentCount} yorum` : 'Yorum yap'
          }
        >
          <Icon name="comment-outline" size={iconSize} color={iconColor} />
          {commentCount > 0 && (
            <Text style={styles.actionCountText}>{commentCount}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={onShare} style={styles.actionButton}>
          <Icon name="share-variant" size={iconSize} color={iconColor} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onSave} style={styles.actionButton} disabled={isSaveLoading}>
        {isSaveLoading ? (
          <ActivityIndicator size="small" color={iconColor} />
        ) : (
          <Icon
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={iconSize}
            color={iconColor}
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

export default PostActions;
