import React from 'react';
import { View, StyleSheet } from 'react-native';
import SimpleSkeletonLoader from '../common/SimpleSkeletonLoader';

const ProfileStatsSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.statItem}>
          <SimpleSkeletonLoader
            width={28}
            height={16}
            borderRadius={4}
            style={styles.statValue}
          />
          <SimpleSkeletonLoader
            width={48}
            height={11}
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
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e8e8e8',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    marginBottom: 2,
  },
  statLabel: {},
});

export default ProfileStatsSkeleton;
