import React, { useEffect, useRef } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteWithProfile } from '../../model/routes.model';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';
import RouteDetailMap from './RouteDetailMap';
import MapRouteStopCard, {
  getMapStopLabel,
  MAP_ROUTE_STOP_CARD_STEP,
} from '../explore/map/MapRouteStopCard';

interface RouteDetailMapModalProps {
  visible: boolean;
  stops: RouteWithProfile[];
  activeStopIndex: number;
  onClose: () => void;
  onStopPress: (index: number) => void;
}

export const RouteDetailMapModal: React.FC<RouteDetailMapModalProps> = ({
  visible,
  stops,
  activeStopIndex,
  onClose,
  onStopPress,
}) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const ownerUserId = stops[0]?.user_id || '';

  const styles = useThemedStyles((t) => ({
    backdrop: {
      flex: 1,
      backgroundColor: t.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    closeHit: {
      padding: 8,
    },
    title: {
      flex: 1,
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '700',
      color: t.textPrimary,
    },
    headerSpacer: {
      width: 40,
    },
    mapWrap: {
      flex: 1,
    },
    sheet: {
      borderTopWidth: 1,
      borderTopColor: t.border,
      backgroundColor: t.background,
      paddingTop: 10,
      paddingBottom: 8,
    },
    sheetLabel: {
      paddingHorizontal: 16,
      paddingBottom: 8,
      fontSize: 12,
      fontWeight: '700',
      color: t.textMuted,
      letterSpacing: 0.4,
    },
    horizontalContent: {
      paddingHorizontal: 10,
      flexDirection: 'row',
      alignItems: 'stretch',
    },
  }));

  useEffect(() => {
    if (!visible || stops.length === 0) {
      return;
    }

    scrollRef.current?.scrollTo({
      x: Math.max(0, activeStopIndex * MAP_ROUTE_STOP_CARD_STEP - 10),
      animated: true,
    });
  }, [activeStopIndex, stops.length, visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeHit}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Kapat"
          >
            <Icon name="close" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Rota haritası</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.mapWrap}>
          <RouteDetailMap
            stops={stops}
            activeStopIndex={activeStopIndex}
            onStopPress={onStopPress}
            variant="modal"
          />
        </View>

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Text style={styles.sheetLabel}>Duraklar</Text>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalContent}
            nestedScrollEnabled
          >
            {stops.map((stop, index) => {
              const stopWithOwner = stop.user_id
                ? stop
                : { ...stop, user_id: ownerUserId };

              return (
                <MapRouteStopCard
                  key={stop.id ?? `modal-stop-${index}`}
                  stop={stopWithOwner}
                  stopLabel={getMapStopLabel(stop)}
                  selected={index === activeStopIndex}
                  onPress={() => onStopPress(index)}
                />
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default RouteDetailMapModal;
