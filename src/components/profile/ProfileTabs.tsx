import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { buildProfileTabs, type ProfileTabKey } from '../../lib/profileTabs';

interface ProfileTabsProps {
  activeTabKey: ProfileTabKey;
  isCurrentUserProfile: boolean;
  onTabChange: (tabKey: ProfileTabKey) => void;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTabKey,
  isCurrentUserProfile,
  onTabChange,
}) => {
  const theme = useAppTheme();
  const tabs = useMemo(
    () => buildProfileTabs(isCurrentUserProfile),
    [isCurrentUserProfile],
  );

  const styles = useThemedStyles((t) => ({
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: t.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.hairlineBorder,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: '#1DA1F2',
    },
  }));

  return (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTabKey === tab.key && styles.activeTab]}
          onPress={() => onTabChange(tab.key)}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTabKey === tab.key }}
          accessibilityLabel={
            tab.key === 'achievements' ? 'Başarılar' : tab.key
          }
        >
          <Icon
            name={tab.icon}
            size={20}
            color={activeTabKey === tab.key ? '#1DA1F2' : theme.textSecondary}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default ProfileTabs;
