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
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e8e8e8',
  },
  statItem: {
    alignItems: 'center',
    paddingVertical: 2,
    minWidth: 72,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    letterSpacing: 0.2,
  },
});

export default ProfileStats;
