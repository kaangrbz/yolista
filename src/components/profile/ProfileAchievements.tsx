import React, { useMemo } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import type { Achievement } from '../../model/achievement.model';
import { pickRecentEarnedAchievements } from '../../utils/achievementDisplay';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { showAchievementSheet } from './AchievementSheetHost';

const PREVIEW_LIMIT = 5;

interface ProfileAchievementsProps {
  earned: Achievement[];
  onViewAllPress: () => void;
}

const ProfileAchievements: React.FC<ProfileAchievementsProps> = ({
  earned,
  onViewAllPress,
}) => {
  const styles = useThemedStyles((t) => ({
    section: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.hairlineBorder,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    title: {
      fontSize: 14,
      fontWeight: '700',
      color: t.textPrimary,
    },
    viewAll: {
      fontSize: 13,
      fontWeight: '600',
      color: '#1DA1F2',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    cell: {
      width: 52,
      alignItems: 'center',
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: t.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cellLabel: {
      marginTop: 4,
      fontSize: 9,
      color: t.textMuted,
      textAlign: 'center',
      maxWidth: 52,
    },
  }));

  const recent = useMemo(
    () => pickRecentEarnedAchievements(earned, PREVIEW_LIMIT),
    [earned],
  );

  if (earned.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Başarılar</Text>
        <TouchableOpacity
          onPress={onViewAllPress}
          accessibilityRole="button"
          accessibilityLabel="Tüm başarıları gör"
        >
          <Text style={styles.viewAll}>Tümünü gör</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        {recent.map((item) => (
          <View key={item.key} style={styles.cell}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => showAchievementSheet(item, false)}
              accessibilityRole="button"
              accessibilityLabel={`${item.label} başarı bilgisi`}
            >
              <MaterialIcons
                name={item.icon_value}
                size={22}
                color={item.color}
              />
            </TouchableOpacity>
            <Text style={styles.cellLabel} numberOfLines={2}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default ProfileAchievements;
