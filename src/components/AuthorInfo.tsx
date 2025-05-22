import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import styles from '../styles';
import Seperator from './Seperator';
import { DropdownMenu } from './DropdownMenu';
import { getTimeAgo } from '../utils/timeAgo';
import RouteModel from '../model/routes.model';
import { showToast } from '../utils/alert';
import { useNavigation } from '@react-navigation/native';

const AuthorInfo = ({ fullName, isVerified, username, createdAt, authorId, callback, loggedUserId, routeId, cityName }: {
  fullName: string;
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
    const handleDeleteRoute = async () => {
      try {
        const { data, error } = await RouteModel.deleteRoute(routeId);
        if (error) {
          console.error('Error deleting route:', error);
          showToast('error', 'Rota silme işlemi sırasında bir hata oluştu');
          return;
        }

        showToast('success', 'Rota silme işlemi başarılı');
        
        try {
          if (callback && typeof callback === 'function') {
            callback();
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

    const navigation = useNavigation();
  return (


    <View style={styles.authorContainer}>
      <View style={styles.authorInfo}>
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
        <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: authorId })}>
          <Text style={styles.authorUsername}>
            @{username}
          </Text>
        </TouchableOpacity>
        <Seperator />
        <Text style={styles.timeAgo}>{getTimeAgo(createdAt)}</Text>
        <Seperator />
        {cityName && (
          <View style={styles.cityContainer}>
            <Icon name="map-marker" size={16} color="#666" />
            <Text style={styles.cityName}>{cityName}</Text>
          </View>
        )}
      </View>
      <DropdownMenu visible={visibleDropdown} handleOpen={() => setVisibleDropdown(true)} handleClose={() => setVisibleDropdown(false)} trigger={<Icon name="dots-vertical" size={20} color="#666" />}>
        {/* <TouchableOpacity style={styles.menuOption}>
              <Icon name="pencil" size={20} color="#666" style={styles.menuItemIcon} />
              <Text style={styles.menuText}>Edit</Text>
            </TouchableOpacity> */}
        {loggedUserId === authorId && (
          <TouchableOpacity style={styles.menuOption} onPress={handleDeleteRoute}>
            <Icon name="delete" size={20} color="#c00" style={styles.menuItemIcon} />
            <Text style={[styles.menuText, { color: '#c00' }]}>Sil</Text>
          </TouchableOpacity>
        )}
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
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2
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
  cityName: {
    fontSize: 12,
    color: '#333',
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
  cityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
    