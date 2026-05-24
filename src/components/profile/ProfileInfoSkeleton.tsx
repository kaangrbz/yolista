import React from 'react';
import { View, StyleSheet } from 'react-native';
import SimpleSkeletonLoader from '../common/SimpleSkeletonLoader';

const ProfileInfoSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.rowOne}>
        <SimpleSkeletonLoader
          width={72}
          height={72}
          borderRadius={36}
          style={styles.avatar}
        />
        <View style={styles.identityBlock}>
          <SimpleSkeletonLoader
            width={140}
            height={18}
            borderRadius={4}
            style={styles.line}
          />
          <SimpleSkeletonLoader
            width={96}
            height={14}
            borderRadius={4}
            style={styles.line}
          />
        </View>
        <SimpleSkeletonLoader
          width={88}
          height={36}
          borderRadius={20}
          style={styles.cta}
        />
      </View>
      <SimpleSkeletonLoader
        width="100%"
        height={14}
        borderRadius={4}
        style={styles.descLine}
      />
      <SimpleSkeletonLoader
        width="75%"
        height={14}
        borderRadius={4}
        style={styles.descLine}
      />
      <SimpleSkeletonLoader
        width={120}
        height={14}
        borderRadius={4}
        style={styles.linkLine}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  rowOne: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    marginRight: 12,
  },
  identityBlock: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  line: {
    marginBottom: 0,
  },
  cta: {
    marginLeft: 8,
  },
  descLine: {
    marginBottom: 8,
  },
  linkLine: {
    marginTop: 4,
  },
});

export default ProfileInfoSkeleton;
