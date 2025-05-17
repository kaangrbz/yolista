import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import styles from '../styles';

const getRandomNumber = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

const ReactionSection = () => (
  <View style={styles.reactionContainer}>
    <TouchableOpacity style={styles.reactionItem}>
      <Icon name="comment-outline" size={18} color="#121" />
      <Text style={styles.reactionText}>{getRandomNumber(1, 10)}</Text>
    </TouchableOpacity>  
    <TouchableOpacity style={styles.reactionItem}>
      <Icon name="heart-outline" size={18} color="#c00" />
      <Text style={styles.reactionText}>{getRandomNumber(1, 50)}</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.reactionItem}>
      <Icon name="eye-outline" size={18} color="#121" />
      <Text style={styles.reactionText}>{getRandomNumber(50, 500)}</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.reactionItem}>
      <Icon name="bookmark-outline" size={18} color="#121" />
    </TouchableOpacity>
    <TouchableOpacity style={styles.reactionItem}>
      <Icon name="share-variant" size={18} color="#121" />
    </TouchableOpacity>
  </View>
);

export default ReactionSection; 

const styles = StyleSheet.create({
  reactionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionText: {
    fontSize: 14,
    color: '#666',
  },
});
