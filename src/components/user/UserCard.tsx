import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Profile } from '../../model/profile.model';
import { supabase } from '../../lib/supabase';
import { DefaultAvatar } from '../../assets';
import { useThemedStyles } from '../../theme/useThemedStyles';

interface UserCardProps {
  user: Profile;
  onPress: () => void;
  compact?: boolean;
  endAdornment?: React.ReactNode;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  onPress,
  compact = false,
  endAdornment,
}) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const styles = useThemedStyles((t) => ({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: t.background,
      borderRadius: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: t.hairlineBorder,
    },
    containerCompact: {
      paddingVertical: 6,
      paddingHorizontal: 0,
      marginBottom: 2,
      backgroundColor: 'transparent',
      borderWidth: 0,
      borderRadius: 0,
    },
    compactRowWithAdornment: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    compactMainPressable: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 0,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: 14,
      borderWidth: 1,
      borderColor: t.hairlineBorder,
    },
    avatarCompact: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 10,
    },
    userInfo: {
      flex: 1,
    },
    nameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    fullName: {
      fontSize: 16,
      fontWeight: '600',
      color: t.textPrimary,
      letterSpacing: -0.2,
    },
    fullNameCompact: {
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: -0.15,
    },
    verifiedIcon: {
      marginLeft: 4,
    },
    username: {
      fontSize: 14,
      color: t.textSecondary,
      marginTop: 3,
    },
    usernameCompact: {
      fontSize: 12,
      marginTop: 1,
    },
  }));

  const downloadImage = async () => {
    const relativePath = user?.image_preview_url || user?.image_url;

    if (!relativePath) {
      setImageUri(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .storage
        .from('profiles')
        .download(`${user.id}/${relativePath}`);

      if (error) {
        console.error('Supabase download error:', error);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUri(reader.result as string);
      };
      reader.readAsDataURL(data);
    } catch (error) {
      console.error('Error in downloadImage:', error);
      setImageUri(null);
    }
  };

  useEffect(() => {
    downloadImage();
  }, [user?.image_url, user?.image_preview_url, user?.id]);

  const mainContent = (
    <>
      <Image
        source={imageUri ? { uri: imageUri } : DefaultAvatar}
        style={[styles.avatar, compact && styles.avatarCompact]}
      />
      <View style={styles.userInfo}>
        <View style={styles.nameContainer}>
          <Text style={[styles.fullName, compact && styles.fullNameCompact]}>
            {user.full_name}
          </Text>
          {user.is_verified && (
            <Icon
              name="check-decagram"
              size={compact ? 14 : 16}
              color="#1DA1F2"
              style={styles.verifiedIcon}
            />
          )}
        </View>
        <Text style={[styles.username, compact && styles.usernameCompact]}>
          @{user.username}
        </Text>
      </View>
    </>
  );

  if (compact && endAdornment != null) {
    return (
      <View
        style={[
          styles.container,
          styles.containerCompact,
          styles.compactRowWithAdornment,
        ]}
      >
        <TouchableOpacity
          style={styles.compactMainPressable}
          onPress={onPress}
          activeOpacity={0.7}
        >
          {mainContent}
        </TouchableOpacity>
        {endAdornment}
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, compact && styles.containerCompact]}
      onPress={onPress}
    >
      {mainContent}
    </TouchableOpacity>
  );
};

export default UserCard;
