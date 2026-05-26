import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SavedCollection } from '../../services/SaveCollectionsService';
import CachedImage from './CachedImage';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';

interface SavedCollectionRowProps {
  collection: SavedCollection;
  isSelected: boolean;
  isLoading: boolean;
  previewUrl?: string | null;
  onPress: () => void;
}

const SavedCollectionRow: React.FC<SavedCollectionRowProps> = ({
  collection,
  isSelected,
  isLoading,
  previewUrl,
  onPress,
}) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    rowContainer: {
      minHeight: 56,
      paddingVertical: 10,
      paddingHorizontal: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.hairlineBorder,
    },
    rowPressed: {
      opacity: 0.75,
    },
    thumbnailWrap: {
      marginRight: 12,
    },
    thumbnail: {
      width: 48,
      height: 48,
      borderRadius: 8,
      backgroundColor: t.borderStrong,
    },
    thumbnailPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 8,
      backgroundColor: t.surfaceMuted,
    },
    textContainer: {
      flex: 1,
      marginRight: 12,
    },
    titleText: {
      fontSize: 16,
      fontWeight: '600',
      color: t.textPrimary,
    },
    noteText: {
      marginTop: 2,
      fontSize: 13,
      color: t.textMuted,
    },
  }));

  const hasPreview = !!previewUrl && previewUrl.length > 0;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.rowContainer,
        pressed && styles.rowPressed,
      ]}
      onPress={onPress}
      disabled={isLoading}
    >
      <View style={styles.thumbnailWrap}>
        {hasPreview ? (
          <CachedImage
            source={{ uri: previewUrl as string }}
            style={styles.thumbnail}
            resizeMode="cover"
            suppressErrorText={true}
            showRetryButton={false}
          />
        ) : (
          <View style={styles.thumbnailPlaceholder} />
        )}
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.titleText} numberOfLines={1}>
          {collection.name}
        </Text>
        {!!collection.note && (
          <Text style={styles.noteText} numberOfLines={1}>
            {collection.note}
          </Text>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color={theme.textPrimary} />
      ) : (
        <Icon
          name={isSelected ? 'bookmark' : 'plus'}
          size={22}
          color={theme.textPrimary}
        />
      )}
    </Pressable>
  );
};

export default SavedCollectionRow;
