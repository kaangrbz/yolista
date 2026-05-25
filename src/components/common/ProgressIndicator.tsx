import React from 'react';
import { View, Text } from 'react-native';
import { useThemedStyles } from '../../theme/useThemedStyles';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepLabels = ['Fotoğraflar', 'Duraklar', 'Kategori', 'Filtreler'],
}) => {
  const styles = useThemedStyles((theme) => ({
    container: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: theme.background,
    },
    progressBarContainer: {
      marginBottom: 16,
    },
    progressBarBackground: {
      height: 4,
      backgroundColor: theme.border,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: theme.accent,
      borderRadius: 2,
    },
    stepLabelsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    stepLabel: {
      alignItems: 'center',
      flex: 1,
    },
    stepCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.border,
      borderWidth: 2,
      borderColor: theme.borderStrong,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    stepCircleActive: {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
    },
    stepCircleCompleted: {
      backgroundColor: theme.accentPositive,
      borderColor: theme.accentPositive,
    },
    stepNumber: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textMuted,
    },
    stepNumberActive: {
      color: theme.background,
    },
    stepText: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    stepTextActive: {
      color: theme.accent,
      fontWeight: '600',
    },
  }));

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressPercentage}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.stepLabelsContainer}>
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <View key={stepNumber} style={styles.stepLabel}>
              <View
                style={[
                  styles.stepCircle,
                  isActive && styles.stepCircleActive,
                  isCompleted && styles.stepCircleCompleted,
                ]}>
                <Text
                  style={[
                    styles.stepNumber,
                    (isActive || isCompleted) && styles.stepNumberActive,
                  ]}>
                  {stepNumber}
                </Text>
              </View>
              <Text
                style={[
                  styles.stepText,
                  isActive && styles.stepTextActive,
                ]}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};
