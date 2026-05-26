import React from 'react';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { WizardStep } from '../../types/createRouteFlowTypes';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';

const STEPS: { key: WizardStep; label: string }[] = [
  { key: 'photo', label: 'Foto' },
  { key: 'stops', label: 'Detay' },
  { key: 'category', label: 'Kategori' },
];

interface WizardStepIndicatorProps {
  currentStep: WizardStep;
}

export const WizardStepIndicator: React.FC<WizardStepIndicatorProps> = ({
  currentStep,
}) => {
  const theme = useAppTheme();
  const currentIndex = STEPS.findIndex((step) => step.key === currentStep);

  const styles = useThemedStyles((t) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
    },
    stepItem: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    dot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
    },
    dotActive: {
      backgroundColor: t.buttonPrimaryBg,
      borderColor: t.buttonPrimaryBg,
    },
    dotComplete: {
      backgroundColor: t.accent,
      borderColor: t.accent,
    },
    dotIdle: {
      backgroundColor: t.background,
      borderColor: t.borderStrong,
    },
    dotText: {
      fontSize: 11,
      fontWeight: '800',
      color: t.buttonPrimaryText,
    },
    label: {
      marginLeft: 6,
      fontSize: 11,
      fontWeight: '600',
      color: t.textMuted,
      flexShrink: 1,
    },
    labelActive: {
      color: t.textPrimary,
    },
    connector: {
      flex: 1,
      height: 1,
      backgroundColor: t.border,
      marginHorizontal: 6,
    },
    connectorComplete: {
      backgroundColor: t.accent,
    },
  }));

  return (
    <View style={styles.row}>
      {STEPS.map((step, index) => {
        const isActive = step.key === currentStep;
        const isComplete = index < currentIndex;

        return (
          <React.Fragment key={step.key}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.dot,
                  isActive && styles.dotActive,
                  isComplete && styles.dotComplete,
                  !isActive && !isComplete && styles.dotIdle,
                ]}
              >
                {isComplete ? (
                  <Icon name="check" size={14} color={theme.background} />
                ) : (
                  <Text style={styles.dotText}>{index + 1}</Text>
                )}
              </View>
              <Text
                numberOfLines={1}
                style={[styles.label, isActive && styles.labelActive]}
              >
                {step.label}
              </Text>
            </View>

            {index < STEPS.length - 1 ? (
              <View
                style={[
                  styles.connector,
                  index < currentIndex && styles.connectorComplete,
                ]}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
};

export default WizardStepIndicator;
