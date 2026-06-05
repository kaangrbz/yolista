import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import type { Achievement } from '../../model/achievement.model';
import { AchievementsGrid } from './AchievementsGrid';
import AchievementsProgressHeader from './AchievementsProgressHeader';
import { sortAchievementsByEarnedAtDesc } from '../../utils/achievementDisplay';
import { useThemedStyles } from '../../theme/useThemedStyles';

interface ProfileAchievementsTabProps {
  earned: Achievement[];
  catalog: Achievement[];
  showFullCatalog: boolean;
  loading?: boolean;
}

const ProfileAchievementsTab: React.FC<ProfileAchievementsTabProps> = ({
  earned,
  catalog,
  showFullCatalog,
  loading = false,
}) => {
  const styles = useThemedStyles((t) => ({
    wrap: {
      flex: 1,
      minHeight: 320,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 24,
    },
    loader: {
      paddingVertical: 48,
    },
  }));

  if (loading) {
    return (
      <View style={styles.wrap}>
        <ActivityIndicator style={styles.loader} />
      </View>
    );
  }

  const displayEarned = showFullCatalog
    ? earned
    : sortAchievementsByEarnedAtDesc(earned);

  return (
    <View style={styles.wrap}>
      {(showFullCatalog || earned.length > 0) && (
        <AchievementsProgressHeader
          earnedCount={earned.length}
          totalCount={showFullCatalog ? catalog.length : undefined}
          showProgress={showFullCatalog}
        />
      )}
      <AchievementsGrid
        earned={displayEarned}
        catalog={catalog}
        showLocked={showFullCatalog}
      />
    </View>
  );
};

export default ProfileAchievementsTab;
