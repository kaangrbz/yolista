import React from 'react';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { DirectionStep } from '../../types/routeSegment.types';
import { getDirectionStepIcon } from '../../utils/directionStepIcons';

export type RouteDirectionsStepsListStyles = {
  stepsSection: object;
  stepsTitle: object;
  stepRow: object;
  stepText: object;
};

interface RouteDirectionsStepsListProps {
  steps: DirectionStep[];
  segmentId?: string;
  styles: RouteDirectionsStepsListStyles;
  iconColor: string;
}

export const RouteDirectionsStepsList: React.FC<RouteDirectionsStepsListProps> = ({
  steps,
  segmentId = 'segment',
  styles,
  iconColor,
}) => {
  if (steps.length === 0) {
    return null;
  }

  return (
    <View style={styles.stepsSection}>
      <Text style={styles.stepsTitle}>Adımlar</Text>
      {steps.map((step, index) => (
        <View key={`${segmentId}-step-${index}`} style={styles.stepRow}>
          <Icon
            name={getDirectionStepIcon(step.maneuverType)}
            size={14}
            color={iconColor}
            style={{ marginTop: 2 }}
          />
          <Text style={styles.stepText}>{step.instruction}</Text>
        </View>
      ))}
    </View>
  );
};

export default RouteDirectionsStepsList;
