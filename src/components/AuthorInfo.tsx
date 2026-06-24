import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Seperator from './Seperator';
import { DropdownMenu } from './DropdownMenu';
import { getTimeAgo } from '../utils/timeAgo';
import RouteModel from '../model/routes.model';
import { showToast } from '../utils/alert';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import SmartImage from './common/smart-image/SmartImage';
import { DefaultAvatar } from '../assets';
import { buildProfileNavigationParams } from '../utils/profileSlug';
import { useAppTheme } from '../context/AppThemeContext';
import { useThemedStyles } from '../theme/useThemedStyles';

const AuthorInfo = ({
  fullName,
  image_url,
  image_preview_url,
  isVerified,
  username,
  createdAt,
  authorId,
  callback,
  loggedUserId,
  routeId,
}: {
  fullName: string;
  image_url?: string;
  image_preview_url?: string;
  isVerified: boolean;
  username: string;
  createdAt: string;
  authorId: string;
  callback?: () => void;
  loggedUserId?: string | null;
  routeId: string;
  cityName?: string;
}) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    authorContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 10,
      backgroundColor: t.background,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    authorInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    authorImage: {
      width: 40,
      height: 40,
      borderRadius: 999,
      marginRight: 5,
    },
    authorName: {
      fontSize: 16,
      fontWeight: '600',
      color: t.textPrimary,
    },
    verifiedIcon: {
      marginLeft: 4,
    },
    authorUsername: {
      fontSize: 14,
      color: t.textSecondary,
      marginLeft: 4,
    },
    timeAgo: {
      fontSize: 12,
      color: t.textMuted,
    },
    menuText: {
      fontSize: 16,
      color: t.textPrimary,
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
  }));

  const [visibleDropdown, setVisibleDropdown] = useState(false);
  const navigation = useNavigation();
  const screenName = useNavigationState((state) => state.routes[state.index].name);

  const handleDeleteRoute = async () => {
    try {
      const { error } = await RouteModel.deleteRoute(routeId);

      if (error) {
        showToast('error', 'Rota silme işlemi sırasında bir hata oluştu');
        return;
      }

      showToast('success', 'Rota silme işlemi başarılı');
      setVisibleDropdown(false);

      if (callback && typeof callback === 'function') {
        callback();

        if (screenName === 'RouteDetail') {
          navigation.goBack();
        }
      }
    } catch {
      showToast('error', 'Rota silme işlemi sırasında bir hata oluştu');
    }
  };

  const handleHideRoute = async () => {
    try {
      const { error } = await RouteModel.hideRoute(routeId);

      if (error) {
        showToast('error', 'Rota gizleme işlemi sırasında bir hata oluştu');
        return;
      }

      showToast('success', 'Rota gizleme işlemi başarılı');
      setVisibleDropdown(false);

      if (callback && typeof callback === 'function') {
        callback();

        if (screenName === 'RouteDetail') {
          navigation.goBack();
        }
      }
    } catch {
      showToast('error', 'Rota gizleme işlemi sırasında bir hata oluştu');
    }
  };

  const handleEditRoute = () => {
    showToast('warning', 'Düzenleme özelliği henüz aktif değil');
    setVisibleDropdown(false);
  };

  const handleReportRoute = () => {
    showToast('warning', 'Raporlama özelliği henüz aktif değil');
    setVisibleDropdown(false);
  };

  return (
    <View style={styles.authorContainer}>
      <View style={styles.authorInfo}>
        <TouchableOpacity
          style={styles.row}
          onPress={() =>
            (navigation as any).navigate(
              'ProfileMain',
              buildProfileNavigationParams({ username }),
            )
          }
        >
          <SmartImage
            kind="user"
            userId={authorId}
            imageUrl={image_url}
            imagePreviewUrl={image_preview_url}
            width={40}
            height={40}
            borderRadius={20}
            style={styles.authorImage}
            fallbackSource={DefaultAvatar}
          />
          <Text style={styles.authorName}>{fullName}</Text>
          {isVerified ? (
            <Icon
              name="check-decagram"
              size={16}
              color="#1DA1F2"
              style={styles.verifiedIcon}
            />
          ) : null}
          <Text style={styles.authorUsername}>@{username}</Text>
        </TouchableOpacity>
        <Seperator />
        <Text style={styles.timeAgo}>{getTimeAgo(createdAt)}</Text>
      </View>

      <DropdownMenu
        visible={visibleDropdown}
        handleOpen={() => setVisibleDropdown(true)}
        handleClose={() => setVisibleDropdown(false)}
        trigger={<Icon name="dots-vertical" size={20} color={theme.textSecondary} />}
      >
        {loggedUserId === authorId ? (
          <>
            <TouchableOpacity style={styles.menuOption} onPress={handleDeleteRoute}>
              <Icon name="delete" size={20} color="#c00" style={styles.menuItemIcon} />
              <Text style={[styles.menuText, { color: '#c00' }]}>Sil</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuOption} onPress={handleHideRoute}>
              <Icon name="archive" size={20} color={theme.textSecondary} style={styles.menuItemIcon} />
              <Text style={styles.menuText}>Arşivle</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuOption} onPress={handleEditRoute}>
              <Icon name="lock" size={20} color={theme.textSecondary} style={styles.menuItemIcon} />
              <Text style={styles.menuText}>Düzenle</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.menuOption} onPress={handleReportRoute}>
            <Icon name="alert-octagon" size={20} color="#c00" style={styles.menuItemIcon} />
            <Text style={styles.menuText}>Raporla</Text>
          </TouchableOpacity>
        )}
      </DropdownMenu>
    </View>
  );
};

export default AuthorInfo;
