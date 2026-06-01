import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { MAP_ACTIVE_ROUTE_BORDER } from '../../constants/mapDefaults';
import type { RouteSheetTab } from '../../types/routeSegment.types';

interface RouteTabBarProps {
  activeTab: RouteSheetTab;
  onTabChange: (tab: RouteSheetTab) => void;
  marginHorizontal?: number;
}

export const RouteTabBar: React.FC<RouteTabBarProps> = ({
  activeTab,
  onTabChange,
  marginHorizontal = 18,
}) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    row: {
      flexDirection: 'row',
      marginHorizontal,
      marginBottom: 12,
      padding: 3,
      borderRadius: 12,
      backgroundColor: t.surfaceMuted,
      gap: 4,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 9,
      borderRadius: 9,
    },
    tabActive: {
      backgroundColor: t.background,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
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

  const tabs: { id: RouteSheetTab; label: string; icon: string }[] = [
    { id: 'stops', label: 'Duraklar', icon: 'map-marker-outline' },
    { id: 'directions', label: 'Rota', icon: 'sign-direction' },
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
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Icon
              name={tab.icon}
              size={16}
              color={isActive ? MAP_ACTIVE_ROUTE_BORDER : theme.textSecondary}
            />
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default RouteTabBar;
