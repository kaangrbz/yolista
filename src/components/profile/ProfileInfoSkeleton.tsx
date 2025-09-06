import React from 'react';
import { View, StyleSheet } from 'react-native';
import SimpleSkeletonLoader from '../common/SimpleSkeletonLoader';

const ProfileInfoSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Profile Photo */}
      <View style={styles.profilePhotoContainer}>
        <SimpleSkeletonLoader
          width={100}
          height={100}
          borderRadius={50}
          style={styles.profilePhoto}
        />
      </View>

      {/* User Details */}
      <View style={styles.userDetails}>
        <SimpleSkeletonLoader
          width={150}
          height={24}
          borderRadius={4}
          style={styles.fullName}
        />
        <SimpleSkeletonLoader
          width={100}
          height={16}
          borderRadius={4}
          style={styles.username}
        />
        <SimpleSkeletonLoader
          width={200}
          height={16}
          borderRadius={4}
          style={styles.description}
        />
        <SimpleSkeletonLoader
          width={120}
          height={16}
          borderRadius={4}
          style={styles.website}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  profilePhotoContainer: {
    marginTop: -50,
    marginBottom: 16,
  },
  profilePhoto: {
    borderWidth: 4,
    borderColor: '#fff',
  },
  userDetails: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  fullName: {
    marginBottom: 4,
  },
  username: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 12,
  },
  website: {
    marginTop: 4,
  },
});

export default ProfileInfoSkeleton;
