import React from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';

interface RouteDetailHeaderSocialActionsProps {
  isLiked: boolean;
  isSaved: boolean;
  isSaveLoading?: boolean;
  likeCount: number;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
}

export const RouteDetailHeaderSocialActions: React.FC<
  RouteDetailHeaderSocialActionsProps
> = ({
  isLiked,
  isSaved,
  isSaveLoading = false,
  likeCount,
  onLike,
  onSave,
  onShare,
}) => {
  const theme = useAppTheme();

  const styles = useThemedStyles((t) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    hit: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 6,
      gap: 2,
    },
    count: {
      fontSize: 11,
      fontWeight: '700',
      color: t.textPrimary,
      minWidth: 10,
    },
  }));

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.hit}
        onPress={onLike}
        accessibilityRole="button"
        accessibilityLabel={isLiked ? 'Beğeniyi kaldır' : 'Beğen'}
      >
        <Icon
          name={isLiked ? 'heart' : 'heart-outline'}
          size={20}
          color={isLiked ? '#ed4956' : theme.textPrimary}
        />
        {likeCount > 0 ? <Text style={styles.count}>{likeCount}</Text> : null}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.hit}
        onPress={onShare}
        accessibilityRole="button"
        accessibilityLabel="Paylaş"
      >
        <Icon name="share-variant" size={20} color={theme.textPrimary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.hit}
        onPress={onSave}
        disabled={isSaveLoading}
        accessibilityRole="button"
        accessibilityLabel={isSaved ? 'Kaydedildi' : 'Kaydet'}
      >
        {isSaveLoading ? (
          <ActivityIndicator size="small" color={theme.textPrimary} />
        ) : (
          <Icon
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={theme.textPrimary}
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

export default RouteDetailHeaderSocialActions;
