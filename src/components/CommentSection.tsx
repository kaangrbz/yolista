import React from 'react';
import { View, Image, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import styles from '../styles';

const CommentSection = ({ imageUrl, parentType }: { imageUrl?: string, parentType: 'routeDetail' | 'bookmarkDetail' | 'homePage' }) => (
  <View style={[
    styles.commentContainer,
    parentType === 'homePage' && styles.homePageCommentContainer,
    parentType === 'routeDetail' && styles.routeDetailCommentContainer,
    parentType === 'bookmarkDetail' && styles.bookmarkDetailCommentContainer,
  ]}>
    <Image
      source={{
        uri: imageUrl || `https://picsum.photos/20/20`,
      }}
      style={[styles.commentImage,
      parentType === 'homePage' && styles.homePageCommentImage,
      parentType === 'routeDetail' && styles.routeDetailCommentImage,
      parentType === 'bookmarkDetail' && styles.bookmarkDetailCommentImage,
      ]}
    />
    <TextInput
      placeholder="Yorum yap"
      placeholderTextColor="#666"
      style={styles.commentInput}
    />
    <TouchableOpacity onPress={() => { }}>
      <Icon name="send" size={16} color="#121" />
    </TouchableOpacity>
  </View>
);

export default CommentSection;

const styles = StyleSheet.create({
  commentContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  commentInput: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  homePageCommentContainer: {
    height: 40,
  },
  routeDetailCommentContainer: {
    height: 40,
  },
  bookmarkDetailCommentContainer: {
    height: 40,
  },
  homePageCommentImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  routeDetailCommentImage: {
    width: 20,
    height: 20,
    borderRadius: 20,
  },
  bookmarkDetailCommentImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});