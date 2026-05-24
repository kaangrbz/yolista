import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { appTheme } from '../../theme/appTheme';

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
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
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

      {/* Step Labels */}
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

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: appTheme.background,
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: appTheme.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: appTheme.accent,
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
    backgroundColor: appTheme.border,
    borderWidth: 2,
    borderColor: appTheme.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: appTheme.accent,
    borderColor: appTheme.accent,
  },
  stepCircleCompleted: {
    backgroundColor: appTheme.accentPositive,
    borderColor: appTheme.accentPositive,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: appTheme.textMuted,
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepText: {
    fontSize: 12,
    color: appTheme.textSecondary,
    textAlign: 'center',
  },
  stepTextActive: {
    color: appTheme.accent,
    fontWeight: '600',
  },
});
