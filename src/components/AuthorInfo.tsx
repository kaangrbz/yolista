import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import styles from '../styles';
import Seperator from './Seperator';
import { DropdownMenu } from './DropdownMenu';
import { getTimeAgo } from '../utils/timeAgo';
import RouteModel from '../model/routes.model';
import { showToast } from '../utils/alert';

const AuthorInfo = ({ fullName, isVerified, username, createdAt, authorId, callback, loggedUserId, routeId }: {
  fullName: string;
  isVerified: boolean;
  username: string;
  createdAt: string;
  authorId: string;
  callback?: () => void;
  loggedUserId?: string | null;
  routeId: string;
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
  return (


    <View style={styles.authorContainer}>
      <View style={styles.authorInfo}>
        <Text style={styles.authorName}>
          {fullName || 'Kaan'}
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
          @{username || 'kaangrx'}
        </Text>
        <Seperator />
        <Text style={styles.timeAgo}>{getTimeAgo(createdAt)}</Text>
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
    marginRight: 10,
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
    