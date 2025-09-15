import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ProfileStatsProps {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  onFollowersPress: () => void;
  onFollowingPress: () => void;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
}

const ProfileStats: React.FC<ProfileStatsProps> = ({
  postsCount,
  followersCount,
  followingCount,
  onFollowersPress,
  onFollowingPress,
  fadeAnim,
  scaleAnim,
}) => {
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.statsRow}>
        {/* Posts Count Card */}
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: '#667eea' }]}>
            <Icon name="view-comfortable" size={24} color="#fff" />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{postsCount}</Text>
            <Text style={styles.statLabel}>Gönderi</Text>
          </View>
        </View>

        {/* Followers Count Card */}
        <TouchableOpacity
          style={styles.statCard}
          onPress={onFollowersPress}
          activeOpacity={0.7}
        >
          <View style={[styles.statIconContainer, { backgroundColor: '#f5576c' }]}>
            <Icon name="account-heart" size={24} color="#fff" />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{followersCount}</Text>
            <Text style={styles.statLabel}>Takipçi</Text>
            <Icon name="chevron-right" size={16} color="#666" style={styles.chevron} />
          </View>
        </TouchableOpacity>

        {/* Following Count Card */}
        <TouchableOpacity
          style={styles.statCard}
          onPress={onFollowingPress}
          activeOpacity={0.7}
        >
          <View style={[styles.statIconContainer, { backgroundColor: '#4facfe' }]}>
            <Icon name="account-group" size={24} color="#fff" />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{followingCount}</Text>
            <Text style={styles.statLabel}>Takip</Text>
            <Icon name="chevron-right" size={16} color="#666" style={styles.chevron} />
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    position: 'relative',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statContent: {
    alignItems: 'center',
    position: 'relative',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  chevron: {
    position: 'absolute',
    right: -8,
    top: '50%',
    marginTop: -8,
  },
});

export default ProfileStats;
