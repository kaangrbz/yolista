import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ProfileStatsSkeleton from './ProfileStatsSkeleton';

interface ProfileStatsProps {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  onFollowersPress: () => void;
  onFollowingPress: () => void;
  loading?: boolean;
}

const ProfileStats: React.FC<ProfileStatsProps> = ({
  postsCount,
  followersCount,
  followingCount,
  onFollowersPress,
  onFollowingPress,
  loading = false,
}) => {
  if (loading) {
    return <ProfileStatsSkeleton />;
  }

  return (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{postsCount}</Text>
        <Text style={styles.statLabel}>Gönderi</Text>
      </View>
      <TouchableOpacity
        style={styles.statItem}
        onPress={onFollowersPress}
      >
        <Text style={styles.statValue}>{followersCount}</Text>
        <Text style={styles.statLabel}>Takipçi</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.statItem}
        onPress={onFollowingPress}
      >
        <Text style={styles.statValue}>{followingCount}</Text>
        <Text style={styles.statLabel}>Takip</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
});

export default ProfileStats;
