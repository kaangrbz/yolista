import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Profile } from '../../model/profile.model';
import { supabase } from '../../lib/supabase';
import { DefaultAvatar } from '../../assets';

interface UserCardProps {
  user: Profile;
  onPress: () => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onPress }) => {
  const [imageUri, setImageUri] = useState<string | null>(null);

    const downloadImage = async () => {
    let image_url: string | undefined = user?.image_url;

    if (!image_url) {
      setImageUri(null);
      return;
    }

    try {
      // If public URL fails, try to download the file
      const { data, error } = await supabase
        .storage
        .from('profiles')
        .download(`${user.id}/${image_url}`);

      if (error) {
        console.error('Supabase download error:', error);
        return;
      }

      // Convert Blob to Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUri(reader.result as string);
      };
      reader.readAsDataURL(data);
    } catch (error) {
      console.error('Error in downloadImage:', error);
      // showToast('error', 'Resim yüklenirken bir hata oluştu');
      setImageUri(null);
    }
  };

  // Trigger the function when the component is mounted or image_url changes
  useEffect(() => {
    downloadImage();
  }, []);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image
        source={imageUri ? { uri: imageUri } : DefaultAvatar}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <View style={styles.nameContainer}>
          <Text style={styles.fullName}>{user.full_name}</Text>
          {user.is_verified && (
            <Icon name="check-decagram" size={16} color="#1DA1F2" style={styles.verifiedIcon} />
          )}
        </View>
        <Text style={styles.username}>@{user.username}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  userInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#121212',
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  username: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default UserCard; 