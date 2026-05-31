import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import { MAP_ACTIVE_ROUTE_BORDER } from '../../../constants/mapDefaults';
import type { RouteSheetTab } from '../../../types/routeSegment.types';

interface MapRouteSheetTabsProps {
  activeTab: RouteSheetTab;
  onTabChange: (tab: RouteSheetTab) => void;
}

export const MapRouteSheetTabs: React.FC<MapRouteSheetTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const styles = useThemedStyles((t) => ({
    row: {
      flexDirection: 'row',
      marginHorizontal: 18,
      marginBottom: 10,
      padding: 3,
      borderRadius: 10,
      backgroundColor: t.surfaceMuted,
      gap: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
    },
    tabActive: {
      backgroundColor: t.background,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    },
    tabText: {
      fontSize: 13,
      fontWeight: '600',
      color: t.textSecondary,
    },
    tabTextActive: {
      color: MAP_ACTIVE_ROUTE_BORDER,
      fontWeight: '700',
    },
  }));

  const tabs: { id: RouteSheetTab; label: string }[] = [
    { id: 'stops', label: 'Duraklar' },
    { id: 'directions', label: 'Rota' },
  ];

  return (
    <View style={styles.row}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, isActive && styles.tabActive]}
            activeOpacity={0.85}
            onPress={() => onTabChange(tab.id)}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default MapRouteSheetTabs;
