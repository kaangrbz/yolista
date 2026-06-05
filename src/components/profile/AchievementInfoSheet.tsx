import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import type { Achievement } from '../../model/achievement.model';
import {
  ACHIEVEMENT_CATEGORY_LABELS,
  withAchievementColorAlpha,
} from '../../utils/achievementDisplay';
import ModalSheetSafeArea from '../common/ModalSheetSafeArea';
import { useThemedStyles } from '../../theme/useThemedStyles';

interface AchievementInfoSheetProps {
  achievement: Achievement;
  locked?: boolean;
  onClose: () => void;
}

const AchievementInfoSheet: React.FC<AchievementInfoSheetProps> = ({
  achievement,
  locked = false,
  onClose,
}) => {
  const accentColor = locked ? '#9CA3AF' : achievement.color;
  const earnedLabel = achievement.earned_at
    ? new Date(achievement.earned_at).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const styles = useThemedStyles((t) => ({
    overlay: {
      flex: 1,
      backgroundColor: t.overlayDark,
      justifyContent: 'flex-end',
    },
    sheetWrap: {
      maxHeight: '72%',
    },
    sheet: {
      backgroundColor: t.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 24,
      paddingTop: 8,
      alignItems: 'center',
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.borderStrong,
      marginBottom: 20,
    },
    heroRing: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
      backgroundColor: withAchievementColorAlpha(accentColor, locked ? 0.08 : 0.16),
      borderWidth: 2,
      borderColor: withAchievementColorAlpha(accentColor, locked ? 0.2 : 0.35),
    },
    heroIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: t.background,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: locked ? 0.5 : 1,
    },
    categoryPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: t.surfaceMuted,
      marginBottom: 10,
    },
    categoryText: {
      fontSize: 11,
      fontWeight: '700',
      color: t.textSecondary,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: t.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
    },
    message: {
      fontSize: 15,
      color: t.textSecondary,
      lineHeight: 22,
      textAlign: 'center',
      marginBottom: 16,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: t.surfaceMuted,
      marginBottom: 20,
    },
    statusText: {
      fontSize: 13,
      fontWeight: '600',
      color: locked ? t.textMuted : t.textPrimary,
    },
    closeButton: {
      alignSelf: 'stretch',
      paddingVertical: 15,
      borderRadius: 14,
      alignItems: 'center',
      marginTop: 4,
    },
    closeButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
    },
  }));

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheetWrap} onPress={(event) => event.stopPropagation()}>
          <ModalSheetSafeArea style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.heroRing}>
              <View style={styles.heroIcon}>
                <MaterialIcons
                  name={achievement.icon_value}
                  size={36}
                  color={accentColor}
                />
              </View>
            </View>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>
                {ACHIEVEMENT_CATEGORY_LABELS[achievement.category]}
              </Text>
            </View>
            <Text style={styles.title}>{achievement.label}</Text>
            <Text style={styles.message}>{achievement.description}</Text>
            <View style={styles.statusRow}>
              <MaterialIcons
                name={locked ? 'lock-outline' : 'check-circle'}
                size={18}
                color={locked ? '#9CA3AF' : accentColor}
              />
              <Text style={styles.statusText}>
                {locked
                  ? 'Henüz kazanılmadı'
                  : earnedLabel
                    ? `Kazanıldı · ${earnedLabel}`
                    : 'Kazanıldı'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: accentColor }]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Tamam"
            >
              <Text style={styles.closeButtonText}>Tamam</Text>
            </TouchableOpacity>
          </ModalSheetSafeArea>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default AchievementInfoSheet;
