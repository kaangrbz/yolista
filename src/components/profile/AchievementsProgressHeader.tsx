import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useThemedStyles } from '../../theme/useThemedStyles';

interface AchievementsProgressHeaderProps {
  earnedCount: number;
  totalCount?: number;
  showProgress?: boolean;
}

const AchievementsProgressHeader: React.FC<AchievementsProgressHeaderProps> = ({
  earnedCount,
  totalCount,
  showProgress = false,
}) => {
  const hasTotal = typeof totalCount === 'number' && totalCount > 0;
  const progress = hasTotal ? Math.min(earnedCount / totalCount, 1) : 0;
  const progressPercent = Math.round(progress * 100);

  const styles = useThemedStyles((t) => ({
    card: {
      backgroundColor: t.surfaceMuted,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.hairlineBorder,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: t.textPrimary,
    },
    countBadge: {
      backgroundColor: t.background,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.hairlineBorder,
    },
    countText: {
      fontSize: 13,
      fontWeight: '700',
      color: t.textPrimary,
    },
    progressTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: t.background,
      overflow: 'hidden',
      marginBottom: 8,
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
      backgroundColor: '#F59E0B',
    },
    subtitle: {
      fontSize: 12,
      color: t.textMuted,
    },
    simpleSummary: {
      fontSize: 13,
      color: t.textMuted,
      marginBottom: 16,
    },
  }));

  if (!showProgress || !hasTotal) {
    return (
      <Text style={styles.simpleSummary}>
        {earnedCount} başarı kazanıldı
      </Text>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <MaterialIcons name="emoji-events" size={22} color="#F59E0B" />
          <Text style={styles.title}>Başarılar</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {earnedCount} / {totalCount}
          </Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
      </View>
      <Text style={styles.subtitle}>
        {progressPercent}% tamamlandı · {totalCount - earnedCount} başarı kaldı
      </Text>
    </View>
  );
};

export default AchievementsProgressHeader;
