import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { DefaultAvatar } from '../../assets';
import { PostHeaderProps } from '../../types/post.types';

const PostHeader: React.FC<PostHeaderProps> = ({
  username,
  userImage,
  location,
  onProfilePress,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.userInfo} onPress={onProfilePress}>
        <Image 
          source={userImage ? { uri: userImage } : DefaultAvatar}
          style={styles.profileImage}
        />
        <View style={styles.userDetails}>
          <Text style={styles.username}>{username}</Text>
          {location && <Text style={styles.location}>{location}</Text>}
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.moreButton}>
        <Icon name="dots-horizontal" size={24} color="#262626" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  location: {
    fontSize: 12,
    color: '#8e8e8e',
  },
  moreButton: {
    padding: 4,
  },
});

export default PostHeader;
