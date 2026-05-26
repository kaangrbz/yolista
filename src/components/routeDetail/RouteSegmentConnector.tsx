import React from 'react';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteWithProfile } from '../../model/routes.model';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';
import {
  getSegmentDistanceLabel,
  getSegmentWalkingLabel,
} from '../../utils/routeDistance';

interface RouteSegmentConnectorProps {
  fromStop: RouteWithProfile;
  toStop: RouteWithProfile;
}

export const RouteSegmentConnector: React.FC<RouteSegmentConnectorProps> = ({
  fromStop,
  toStop,
}) => {
  const theme = useAppTheme();
  const distanceLabel = getSegmentDistanceLabel(fromStop, toStop);
  const walkingLabel = getSegmentWalkingLabel(fromStop, toStop);

  if (!distanceLabel) {
    return null;
  }

  const styles = useThemedStyles((t) => ({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 4,
      gap: 8,
    },
    line: {
      width: 2,
      height: 18,
      borderRadius: 1,
      backgroundColor: t.border,
    },
    text: {
      fontSize: 11,
      color: t.textSecondary,
      fontWeight: '600',
    },
  }));

  const label = walkingLabel ? `${distanceLabel} · ${walkingLabel}` : distanceLabel;

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Icon name="arrow-down" size={14} color={theme.textSecondary} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
};

export default RouteSegmentConnector;
