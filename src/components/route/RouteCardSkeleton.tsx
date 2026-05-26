import React from 'react';
import { View, Dimensions } from 'react-native';
import {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { ReanimatedView } from '../../utils/reanimatedComponents';
import { useThemedStyles } from '../../theme/useThemedStyles';

const { width } = Dimensions.get('window');

interface RouteCardSkeletonProps {
  isExploreScreen?: boolean;
}

const RouteCardSkeleton: React.FC<RouteCardSkeletonProps> = ({ isExploreScreen = false }) => {
  const shimmerValue = useSharedValue(0);
  const styles = useThemedStyles((t) => ({
    cardContainer: {
      marginBottom: 16,
    },
    routeCard: {
      backgroundColor: t.background,
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    authorInfoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    avatarSkeleton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.surfaceMuted,
    },
    authorInfoSkeleton: {
      marginLeft: 12,
      flex: 1,
    },
    nameSkeleton: {
      width: 120,
      height: 16,
      backgroundColor: t.surfaceMuted,
      borderRadius: 4,
      marginBottom: 4,
    },
    usernameSkeleton: {
      width: 80,
      height: 14,
      backgroundColor: t.surfaceMuted,
      borderRadius: 4,
    },
    imageContainer: {
      width: '100%',
      height: 200,
      backgroundColor: t.surfaceMuted,
      position: 'relative',
      overflow: 'hidden',
    },
    contentContainer: {
      padding: 16,
    },
    titleSkeleton: {
      width: '80%',
      height: 24,
      backgroundColor: t.surfaceMuted,
      borderRadius: 4,
      marginBottom: 12,
    },
    categorySkeleton: {
      width: 100,
      height: 16,
      backgroundColor: t.surfaceMuted,
      borderRadius: 4,
      marginBottom: 12,
    },
    descriptionSkeleton: {
      width: '100%',
      height: 16,
      backgroundColor: t.surfaceMuted,
      borderRadius: 4,
      marginBottom: 8,
    },
    reactionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: t.hairlineBorder,
    },
    reactionSkeleton: {
      width: 24,
      height: 24,
      backgroundColor: t.surfaceMuted,
      borderRadius: 12,
    },
    commentInputSkeleton: {
      height: 40,
      backgroundColor: t.surfaceMuted,
      borderRadius: 20,
      marginTop: 16,
    },
    shimmer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    shimmerOverlay: {
      flex: 1,
      backgroundColor: t.borderStrong,
      opacity: 0.35,
    },
    exploreCard: {
      backgroundColor: t.background,
      borderRadius: 8,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    exploreImageContainer: {
      width: '100%',
      aspectRatio: 1,
      backgroundColor: t.surfaceMuted,
      position: 'relative',
      overflow: 'hidden',
    },
    exploreInfo: {
      padding: 8,
    },
    exploreTitleSkeleton: {
      width: '80%',
      height: 16,
      backgroundColor: t.surfaceMuted,
      borderRadius: 4,
      marginBottom: 8,
    },
    exploreDescriptionSkeleton: {
      width: '60%',
      height: 14,
      backgroundColor: t.surfaceMuted,
      borderRadius: 4,
    },
  }));

  React.useEffect(() => {
    shimmerValue.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.linear }),
        withTiming(0, { duration: 1000, easing: Easing.linear }),
      ),
      -1,
      false,
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shimmerValue.value * width }],
    };
  });

  if (isExploreScreen) {
    return (
      <View style={styles.exploreCard}>
        <View style={styles.exploreImageContainer}>
          <ReanimatedView style={[styles.shimmer, shimmerStyle]}>
            <View style={styles.shimmerOverlay} />
          </ReanimatedView>
        </View>
        <View style={styles.exploreInfo}>
          <View style={styles.exploreTitleSkeleton} />
          <View style={styles.exploreDescriptionSkeleton} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.cardContainer}>
      <View style={styles.routeCard}>
        <View style={styles.authorInfoContainer}>
          <View style={styles.avatarSkeleton} />
          <View style={styles.authorInfoSkeleton}>
            <View style={styles.nameSkeleton} />
            <View style={styles.usernameSkeleton} />
          </View>
        </View>

        <View style={styles.imageContainer}>
          <ReanimatedView style={[styles.shimmer, shimmerStyle]}>
            <View style={styles.shimmerOverlay} />
          </ReanimatedView>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.titleSkeleton} />
          <View style={styles.categorySkeleton} />
          <View style={styles.descriptionSkeleton} />
          <View style={styles.descriptionSkeleton} />

          <View style={styles.reactionsContainer}>
            {[1, 2, 3, 4, 5].map((_, index) => (
              <View key={index} style={styles.reactionSkeleton} />
            ))}
          </View>

          <View style={styles.commentInputSkeleton} />
        </View>
      </View>
    </View>
  );
};

export default RouteCardSkeleton;
