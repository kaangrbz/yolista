import React from 'react';
import { View, StyleSheet } from 'react-native';
import SimpleSkeletonLoader from '../common/SimpleSkeletonLoader';

const ProfileStatsSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.statItem}>
          <SimpleSkeletonLoader
            width={30}
            height={20}
            borderRadius={4}
            style={styles.statValue}
          />
          <SimpleSkeletonLoader
            width={60}
            height={14}
            borderRadius={4}
            style={styles.statLabel}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    marginBottom: 4,
  },
  statLabel: {},
});

export default ProfileStatsSkeleton;
