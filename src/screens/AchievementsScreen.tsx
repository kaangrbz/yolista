import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SocialListHeader } from '../components/header/Header';
import { AchievementsGrid } from '../components/profile/AchievementsGrid';
import AchievementsProgressHeader from '../components/profile/AchievementsProgressHeader';
import AchievementSheetHost from '../components/profile/AchievementSheetHost';
import {
  fetchAchievementCatalog,
  fetchUserAchievements,
} from '../lib/achievements';
import type { Achievement } from '../model/achievement.model';
import {
  isAchievementsRouteParams,
  type AchievementsRouteParams,
} from '../types/achievementsNavigation';
import { sortAchievementsByEarnedAtDesc } from '../utils/achievementDisplay';
import { useThemedStyles } from '../theme/useThemedStyles';

type Props = {
  navigation: { goBack: () => void };
  route: { params?: AchievementsRouteParams };
};

const AchievementsScreen: React.FC<Props> = ({ navigation, route }) => {
  const params = route.params;
  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.background,
    },
    scroll: {
      flex: 1,
    },
    content: {
      padding: 16,
      paddingBottom: 32,
    },
    loader: {
      paddingVertical: 48,
    },
  }));

  const [earned, setEarned] = useState<Achievement[]>([]);
  const [catalog, setCatalog] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = isAchievementsRouteParams(params) ? params.userId : '';
  const showFullCatalog = isAchievementsRouteParams(params) && params.showFullCatalog === true;
  const username = isAchievementsRouteParams(params) ? params.username : undefined;

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [earnedRows, catalogRows] = await Promise.all([
        fetchUserAchievements(userId),
        showFullCatalog ? fetchAchievementCatalog() : Promise.resolve([]),
      ]);
      setEarned(earnedRows);
      setCatalog(catalogRows);
    } finally {
      setLoading(false);
    }
  }, [userId, showFullCatalog]);

  useEffect(() => {
    void load();
  }, [load]);

  const title = username ? `@${username} — Başarılar` : 'Başarılar';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <SocialListHeader navigation={navigation} title={title} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator style={styles.loader} />
        ) : (
          <>
            <AchievementsProgressHeader
              earnedCount={earned.length}
              totalCount={showFullCatalog ? catalog.length : undefined}
              showProgress={showFullCatalog}
            />
            <AchievementsGrid
              earned={
                showFullCatalog ? earned : sortAchievementsByEarnedAtDesc(earned)
              }
              catalog={catalog}
              showLocked={showFullCatalog}
            />
          </>
        )}
      </ScrollView>
      <AchievementSheetHost />
    </SafeAreaView>
  );
};

export default AchievementsScreen;
