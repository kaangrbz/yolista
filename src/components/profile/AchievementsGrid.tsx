import React, { useMemo } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import type { Achievement } from '../../model/achievement.model';
import { useThemedStyles } from '../../theme/useThemedStyles';
import {
  groupAchievementsByCategory,
  withAchievementColorAlpha,
  type AchievementGridItem,
} from '../../utils/achievementDisplay';
import { showAchievementSheet } from './AchievementSheetHost';

export type { AchievementGridItem };

interface AchievementsGridProps {
  earned: Achievement[];
  catalog?: Achievement[];
  showLocked?: boolean;
}

const GRID_COLUMNS = 3;
const GRID_GAP = 10;
const HORIZONTAL_PADDING = 0;

const AchievementCard: React.FC<{
  item: AchievementGridItem;
  cardWidth: number;
}> = ({ item, cardWidth }) => {
  const locked = item.locked === true;
  const styles = useThemedStyles((t) => ({
    card: {
      width: cardWidth,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: 'center',
      backgroundColor: locked ? t.surfaceMuted : withAchievementColorAlpha(item.color, 0.1),
      borderWidth: locked ? StyleSheet.hairlineWidth : 1.5,
      borderColor: locked ? t.hairlineBorder : withAchievementColorAlpha(item.color, 0.35),
    },
    iconWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: t.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
      opacity: locked ? 0.45 : 1,
    },
    lockBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: t.textMuted,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: t.background,
    },
    earnedBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: item.color,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: t.background,
    },
    iconHolder: {
      position: 'relative',
    },
    cellLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: locked ? t.textMuted : t.textPrimary,
      textAlign: 'center',
      lineHeight: 14,
    },
  }));

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => showAchievementSheet(item, locked)}
      accessibilityRole="button"
      accessibilityLabel={`${item.label} başarı bilgisi`}
      activeOpacity={0.75}
    >
      <View style={styles.iconHolder}>
        <View style={styles.iconWrap}>
          <MaterialIcons
            name={item.icon_value}
            size={26}
            color={locked ? '#9CA3AF' : item.color}
          />
        </View>
        {locked ? (
          <View style={styles.lockBadge}>
            <MaterialIcons name="lock" size={10} color="#fff" />
          </View>
        ) : (
          <View style={styles.earnedBadge}>
            <MaterialIcons name="check" size={11} color="#fff" />
          </View>
        )}
      </View>
      <Text style={styles.cellLabel} numberOfLines={2}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );
};

export const AchievementsGrid: React.FC<AchievementsGridProps> = ({
  earned,
  catalog = [],
  showLocked = false,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = screenWidth - 32 - HORIZONTAL_PADDING;
  const cardWidth =
    (contentWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

  const styles = useThemedStyles((t) => ({
    wrap: {
      gap: 20,
    },
    section: {
      gap: 10,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: t.textPrimary,
    },
    sectionCount: {
      fontSize: 12,
      color: t.textMuted,
      fontWeight: '600',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: GRID_GAP,
    },
    emptyWrap: {
      alignItems: 'center',
      paddingVertical: 40,
      paddingHorizontal: 24,
      gap: 8,
    },
    emptyIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: t.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: t.textPrimary,
      textAlign: 'center',
    },
    empty: {
      fontSize: 13,
      color: t.textMuted,
      textAlign: 'center',
      lineHeight: 18,
    },
  }));

  const displayItems = useMemo((): AchievementGridItem[] => {
    if (showLocked && catalog.length > 0) {
      const earnedMap = new Map(earned.map((a) => [a.key, a]));
      return [...catalog]
        .sort((a, b) => a.sort_order - b.sort_order || a.key.localeCompare(b.key))
        .map((def) => {
          const won = earnedMap.get(def.key);
          return {
            ...def,
            earned_at: won?.earned_at ?? null,
            locked: !won,
          };
        });
    }
    return [...earned].sort(
      (a, b) => a.sort_order - b.sort_order || a.key.localeCompare(b.key),
    );
  }, [showLocked, catalog, earned]);

  const sections = useMemo(() => {
    if (showLocked && catalog.length > 0) {
      return groupAchievementsByCategory(displayItems);
    }
    return [{ category: null as never, label: '', items: displayItems }];
  }, [showLocked, catalog.length, displayItems]);

  if (displayItems.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIcon}>
          <MaterialIcons name="emoji-events" size={28} color="#9CA3AF" />
        </View>
        <Text style={styles.emptyTitle}>Henüz başarı yok</Text>
        <Text style={styles.empty}>
          Yolculuklara devam et, keşfet ve toplulukla etkileşime geç — başarılar burada görünecek.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {sections.map((section) => {
        const earnedInSection = section.items.filter((item) => !item.locked).length;

        return (
          <View key={section.label || 'all'} style={styles.section}>
            {section.label ? (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.label}</Text>
                <Text style={styles.sectionCount}>
                  {earnedInSection} / {section.items.length}
                </Text>
              </View>
            ) : null}
            <View style={styles.grid}>
              {section.items.map((item) => (
                <AchievementCard key={item.key} item={item} cardWidth={cardWidth} />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default AchievementsGrid;
