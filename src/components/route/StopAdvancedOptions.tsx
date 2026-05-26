import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  STOP_TITLE_MAX_LENGTH,
} from '../../constants/routeContentLimits';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';

interface StopAdvancedOptionsProps {
  hint: string;
  onHintChange: (value: string) => void;
}

export const StopAdvancedOptions: React.FC<StopAdvancedOptionsProps> = ({
  hint,
  onHintChange,
}) => {
  const theme = useAppTheme();
  const [expanded, setExpanded] = useState(false);

  const styles = useThemedStyles((t) => ({
    container: {
      marginTop: 4,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
    },
    toggleLabel: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: t.textSecondary,
      marginLeft: 6,
    },
    panel: {
      paddingBottom: 8,
      gap: 16,
    },
    inputGroup: {
      gap: 8,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    label: {
      fontSize: 15,
      fontWeight: '600',
      color: t.textPrimary,
      marginLeft: 8,
    },
    optional: {
      fontSize: 12,
      color: t.textMuted,
      marginLeft: 6,
      textTransform: 'lowercase',
    },
    input: {
      borderWidth: 1,
      borderColor: t.borderStrong,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: t.textPrimary,
      backgroundColor: t.background,
    },
    charCount: {
      fontSize: 12,
      color: t.textMuted,
      textAlign: 'right',
    },
    stubRow: {
      flexDirection: 'row',
      alignItems: 'center',
      opacity: 0.55,
    },
    stubLabel: {
      fontSize: 15,
      color: t.textSecondary,
      marginLeft: 8,
      flex: 1,
    },
    stubBadge: {
      fontSize: 11,
      color: t.textMuted,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
  }));

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.toggleRow}
        onPress={() => setExpanded((value) => !value)}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel="Gelişmiş seçenekler"
      >
        <Icon
          name={expanded ? 'chevron-down' : 'chevron-right'}
          size={20}
          color={theme.textSecondary}
        />
        <Text style={styles.toggleLabel}>Gelişmiş seçenekler</Text>
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.panel}>
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Icon name="information-outline" size={16} color={theme.textSecondary} />
              <Text style={styles.label}>Fotoğraf ipucu</Text>
              <Text style={styles.optional}>opsiyonel</Text>
            </View>
            <TextInput
              style={styles.input}
              value={hint}
              onChangeText={onHintChange}
              placeholder="Kısa bir ipucu — carousel'de görünür"
              placeholderTextColor={theme.textMuted}
              maxLength={STOP_TITLE_MAX_LENGTH}
            />
            <Text style={styles.charCount}>
              {hint.length}/{STOP_TITLE_MAX_LENGTH}
            </Text>
          </View>

          <View style={styles.stubRow}>
            <Icon name="shuffle-variant" size={16} color={theme.textMuted} />
            <Text style={styles.stubLabel}>Remiks yapılabilir</Text>
            <Text style={styles.stubBadge}>Yakında</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
};

export default StopAdvancedOptions;
