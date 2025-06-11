import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import styles from '../styles';
import Seperator from './Seperator';
import { DropdownMenu } from './DropdownMenu';
import { getTimeAgo } from '../utils/timeAgo';
import RouteModel from '../model/routes.model';
import { showToast } from '../utils/alert';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { DefaultAvatar, NoImage } from '../assets';
import { supabase } from '../lib/supabase';

const AuthorInfo = ({ fullName, image_url, isVerified, username, createdAt, authorId, callback, loggedUserId, routeId, cityName }: {
  fullName: string;
  image_url?: string;
  isVerified: boolean;
  username: string;
  createdAt: string;
  authorId: string;
  callback?: () => void;
  loggedUserId?: string | null;
  routeId: string;
  cityName?: string;
}) => {
  const [visibleDropdown, setVisibleDropdown] = useState(false);
  const navigation = useNavigation();
  const screenName = useNavigationState((state) => state.routes[state.index].name)
  const [imageUri, setImageUri] = useState<string | null>(null);

  const handleDeleteRoute = async () => {
    try {
      const { data, error } = await RouteModel.deleteRoute(routeId);
      if (error) {
        console.error('Error deleting route:', error);
        showToast('error', 'Rota silme işlemi sırasında bir hata oluştu');
        return;
      }

      showToast('success', 'Rota silme işlemi başarılı');
      setVisibleDropdown(false);

      try {
        if (callback && typeof callback === 'function') {
          callback();
          if (screenName === 'RouteDetail') {
            navigation.goBack();
          }
        }
      } catch (error) {
        console.error('Error deleting route:', error);
        showToast('error', 'Rota silme işlemi sırasında bir hata oluştu');
      }
    } catch (error) {
      console.error('Error deleting route:', error);
      showToast('error', 'Rota silme işlemi sırasında bir hata oluştu');
    }
  };

  const handleHideRoute = async () => {
    try {
      const { data, error } = await RouteModel.hideRoute(routeId);
      if (error) {
        console.error('Error hiding route:', error);
        showToast('error', 'Rota gizleme işlemi sırasında bir hata oluştu');
        return;
      }

      showToast('success', 'Rota gizleme işlemi başarılı');
      setVisibleDropdown(false);

      try {
        if (callback && typeof callback === 'function') {
          callback();
          if (screenName === 'RouteDetail') {
            navigation.goBack();
          }
        }
      } catch (error) {
        console.error('Error hiding route:', error);
        showToast('error', 'Rota gizleme işlemi sırasında bir hata oluştu');
      }
    } catch (error) {
      console.error('Error hiding route:', error);
      showToast('error', 'Rota gizleme işlemi sırasında bir hata oluştu');
    }
  }

  const handleEditRoute = async () => {
    showToast('warning', 'Düzenleme özelliği henüz aktif değil')
    setVisibleDropdown(false);
  }

  const handleReportRoute = async () => {
    showToast('warning', 'Raporlama özelliği henüz aktif değil')
    setVisibleDropdown(false);
  }


  // Function to download the image
  const downloadImage = async (image_url: string | undefined) => {

    if (!image_url) {
      setImageUri(null);
      return;
    } 

    try {
      // If public URL fails, try to download the file
      const { data, error } = await supabase
        .storage
        .from('profiles')
        .download(`${authorId}/${image_url}`);

      if (error) {
        console.error('Supabase download error:', error);
        throw error;
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
    } finally {
    }
  };

  // Trigger the function when the component is mounted or image_url changes
  useEffect(() => {
    downloadImage(image_url);
  }, [image_url]);

  return (
    <View style={styles.authorContainer}>
      <View style={styles.authorInfo}>
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('ProfileMain', { userId: authorId })}>
          <Image
            source={imageUri ? { uri: imageUri } : DefaultAvatar}
            style={styles.authorImage}
            resizeMode="cover"
          />
          <Text style={styles.authorName}>
            {fullName}
          </Text>
          {(isVerified || false) && (
            <Icon
              name="check-decagram"
              size={16}
              color="#1DA1F2"
              style={styles.verifiedIcon}
            />
          )}
          <Text style={styles.authorUsername}>
            @{username}
          </Text>

        </TouchableOpacity>
        <Seperator />
        <Text style={styles.timeAgo}>{getTimeAgo(createdAt)}</Text>
      </View>
      <DropdownMenu visible={visibleDropdown} handleOpen={() => setVisibleDropdown(true)} handleClose={() => setVisibleDropdown(false)} trigger={<Icon name="dots-vertical" size={20} color="#666" />}>
        {/* <TouchableOpacity style={styles.menuOption}>
              <Icon name="pencil" size={20} color="#666" style={styles.menuItemIcon} />
              <Text style={styles.menuText}>Edit</Text>
            </TouchableOpacity> */}
        {loggedUserId === authorId && (
          <>
            <TouchableOpacity style={styles.menuOption} onPress={handleDeleteRoute}>
              <Icon name="delete" size={20} color="#c00" style={styles.menuItemIcon} />
              <Text style={[styles.menuText, { color: '#c00' }]}>Sil</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuOption} onPress={handleHideRoute}>
              <Icon name="archive" size={20} color="#333" style={styles.menuItemIcon} />
              <Text style={styles.menuText}>Arşivle</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuOption} onPress={handleEditRoute}>
              <Icon name="lock" size={20} color="#333" style={styles.menuItemIcon} />
              <Text style={styles.menuText}>Düzenle</Text>
            </TouchableOpacity>
          </>
        )}

        {loggedUserId !== authorId &&
          <TouchableOpacity style={styles.menuOption} onPress={handleReportRoute}>
            <Icon name="alert-octagon" size={20} color="#c00" style={styles.menuItemIcon} />
            <Text style={styles.menuText}>Raporla</Text>
          </TouchableOpacity>
        }
      </DropdownMenu>
    </View>
  )
};

export default AuthorInfo;

const styles = StyleSheet.create({
  authorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2
  },
  authorImage: {
    width: 40,
    height: 40,
    borderRadius: 999, // Do not use borderRadius: string, it is not supported on andriod i guess
    marginRight: 5,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  authorUsername: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  moreButton: {
    padding: 4,
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
  },
  menuText: {
    fontSize: 16,
    color: '#222',
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginVertical: 5,
  },
  menuItemIcon: {
    marginRight: 10,
  },
});
