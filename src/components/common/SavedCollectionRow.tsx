import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SavedCollection } from '../../services/SaveCollectionsService';
import CachedImage from './CachedImage';

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
        <ActivityIndicator size="small" color="#111" />
      ) : (
        <Icon
          name={isSelected ? 'bookmark' : 'plus'}
          size={22}
          color="#111"
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  rowContainer: {
    minHeight: 56,
    paddingVertical: 10,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e3e3e3',
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
    backgroundColor: '#eee',
  },
  thumbnailPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#e8e8e8',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#121212',
  },
  noteText: {
    marginTop: 2,
    fontSize: 13,
    color: '#7a7a7a',
  },
});

export default SavedCollectionRow;
