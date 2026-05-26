import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RouteWithProfile } from '../../model/routes.model';
import { useThemedStyles } from '../../theme/useThemedStyles';
import RouteDetailMap from './RouteDetailMap';
import RouteSegmentCard from './RouteSegmentCard';
import RouteSegmentConnector from './RouteSegmentConnector';
import RouteSummaryBar from './RouteSummaryBar';

interface RouteSplitViewProps {
  stops: RouteWithProfile[];
  activeStopIndex: number;
  onStopPress: (index: number) => void;
}

export const RouteSplitView: React.FC<RouteSplitViewProps> = ({
  stops,
  activeStopIndex,
  onStopPress,
}) => {
  const styles = useThemedStyles((t) => ({
    container: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.border,
    },
    sectionTitle: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
      fontSize: 12,
      fontWeight: '700',
      color: t.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    segmentList: {
      paddingBottom: 12,
      gap: 8,
    },
  }));

  return (
    <View style={styles.container}>
      <RouteDetailMap
        stops={stops}
        activeStopIndex={activeStopIndex}
        onStopPress={onStopPress}
      />
      <RouteSummaryBar stops={stops} />

      <Text style={styles.sectionTitle}>Duraklar</Text>

      <View style={styles.segmentList}>
        {stops.map((stop, index) => (
          <React.Fragment key={stop.id ?? `segment-${index}`}>
            <RouteSegmentCard
              stop={stop}
              stopIndex={index}
              selected={index === activeStopIndex}
              onPress={() => onStopPress(index)}
            />
            {index < stops.length - 1 ? (
              <RouteSegmentConnector fromStop={stop} toStop={stops[index + 1]} />
            ) : null}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

export default RouteSplitView;
