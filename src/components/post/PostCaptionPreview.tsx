import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useThemedStyles } from '../../theme/useThemedStyles';

interface PostCaptionPreviewProps {
  description?: string;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

const PREVIEW_CHAR_THRESHOLD = 100;

const PostCaptionPreview: React.FC<PostCaptionPreviewProps> = ({
  description,
  isExpanded,
  onToggleExpanded,
}) => {
  const trimmedDescription = description?.trim() ?? '';

  const styles = useThemedStyles((t) => ({
    container: {
      paddingHorizontal: 12,
      paddingTop: 4,
      paddingBottom: 8,
    },
    description: {
      fontSize: 14,
      lineHeight: 20,
      color: t.textPrimary,
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

  if (!trimmedDescription) {
    return null;
  }

  const canExpand = trimmedDescription.length > PREVIEW_CHAR_THRESHOLD;

  return (
    <View style={styles.container}>
      <Text
        style={styles.description}
        numberOfLines={isExpanded ? undefined : 2}
      >
        {trimmedDescription}
      </Text>
      {canExpand ? (
        <TouchableOpacity
          style={styles.seeMoreButton}
          onPress={onToggleExpanded}
          accessibilityRole="button"
          accessibilityLabel={isExpanded ? 'Daha az göster' : 'Devamını oku'}
        >
          <Text style={styles.seeMoreText}>
            {isExpanded ? 'daha az' : 'devamını oku'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default PostCaptionPreview;
