import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
// import styles from '../styles';

interface ReactionSectionProps {
  likeCount: number;
  commentCount: number;
  viewCount: number;
  didLike?: boolean;
  routeId?: string;
  onLike?: (routeId: string, isLiked: boolean) => void;
}

const ReactionSection = ({
  likeCount = 0,
  commentCount = 0,
  viewCount = 0,
  didLike = false,
  routeId,
  onLike
}: ReactionSectionProps) => {
  // Local state to handle optimistic UI updates
  console.log("like", didLike)
  const [isLiked, setIsLiked] = useState(didLike);
  const [localLikeCount, setLocalLikeCount] = useState(likeCount);
  
  useEffect(() => {
    setIsLiked(didLike);
    setLocalLikeCount(likeCount);
  }, [didLike, likeCount]);
  
  const handleLike = () => {
    if (!routeId) return;
    
    // Toggle like state
    const newLikeState = !isLiked;
    setIsLiked(newLikeState);
    
    // Update count optimistically
    setLocalLikeCount(prev => newLikeState ? prev + 1 : Math.max(0, prev - 1));
    
    // Call parent callback if provided
    if (onLike) {
      onLike(routeId, newLikeState);
    }
  };
  
  return (
    <View style={styles.reactionContainer}>
      <TouchableOpacity style={styles.reactionItem}>
        <Icon name="comment-outline" size={18} color="#121" />
        <Text style={styles.reactionText}>{commentCount || 0}</Text>
      </TouchableOpacity>  
      <TouchableOpacity style={styles.reactionItem} onPress={handleLike}>
        <Icon 
          name={isLiked ? "heart" : "heart-outline"} 
          size={18} 
          color={isLiked ? "#c00" : "#c00"} 
        />
        <Text style={styles.reactionText}>{localLikeCount}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.reactionItem}>
        <Icon name="eye-outline" size={18} color="#121" />
        <Text style={styles.reactionText}>{viewCount || 0}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.reactionItem}>
        <Icon name="bookmark-outline" size={18} color="#121" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.reactionItem}>
        <Icon name="share-variant" size={18} color="#121" />
      </TouchableOpacity>
    </View>
  );
};

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
