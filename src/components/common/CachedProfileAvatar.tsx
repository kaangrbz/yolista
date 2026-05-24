import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  ActivityIndicator,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { DefaultAvatar } from '../../assets';
import { profileAvatarCache } from '../../services/ProfileAvatarCache';

interface CachedProfileAvatarProps {
  userId: string;
  imageUrl?: string | null;
  imagePreviewUrl?: string | null;
  profileDeleted?: boolean;
  size?: number;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
}

const CachedProfileAvatar: React.FC<CachedProfileAvatarProps> = ({
  userId,
  imageUrl,
  imagePreviewUrl,
  profileDeleted = false,
  size = 44,
  style,
  imageStyle,
}) => {
  const [imageUri, setImageUri] = useState<string | null>(() => {
    const cached = profileAvatarCache.peek(userId, imagePreviewUrl, imageUrl);

    if (cached === undefined) {
      return null;
    }

    return cached;
  });
  const [loading, setLoading] = useState(() => {
    const cached = profileAvatarCache.peek(userId, imagePreviewUrl, imageUrl);

    return cached === undefined;
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const cached = profileAvatarCache.peek(userId, imagePreviewUrl, imageUrl);

      if (cached !== undefined) {
        if (!cancelled) {
          setImageUri(cached);
          setLoading(false);
        }

        return;
      }

      if (!cancelled) {
        setLoading(true);
      }

      const uri = await profileAvatarCache.resolve({
        userId,
        imageUrl,
        imagePreviewUrl,
        profileDeleted,
      });

      if (!cancelled) {
        setImageUri(uri);
        setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [userId, imageUrl, imagePreviewUrl, profileDeleted]);

  const radius = size / 2;

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: radius },
        style,
      ]}
    >
      {loading ? (
        <View style={[styles.placeholder, { borderRadius: radius }]}>
          <ActivityIndicator size="small" color="#8E8E93" />
        </View>
      ) : imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={[
            styles.image,
            { width: size, height: size, borderRadius: radius },
            imageStyle,
          ]}
        />
      ) : (
        <View style={[styles.placeholder, { borderRadius: radius }]}>
          <Icon name="account" size={Math.round(size * 0.55)} color="#8E8E93" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  image: {
    backgroundColor: '#F0F0F0',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
  },
});

export default CachedProfileAvatar;
