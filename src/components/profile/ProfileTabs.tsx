import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';

interface ProfileTabsProps {
  activeTab: number;
  isCurrentUserProfile: boolean;
  onTabChange: (tabIndex: number) => void;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  isCurrentUserProfile,
  onTabChange,
}) => {
  const theme = useAppTheme();
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

  const tabs = [
    { index: 0, icon: 'grid', label: 'Grid' },
    { index: 1, icon: 'format-list-bulleted', label: 'List' },
  ];

  if (isCurrentUserProfile) {
    tabs.push(
      { index: 2, icon: 'bookmark', label: 'Saved' },
      { index: 3, icon: 'heart', label: 'Liked' },
    );
  }

  return (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.index}
          style={[styles.tab, activeTab === tab.index && styles.activeTab]}
          onPress={() => onTabChange(tab.index)}
        >
          <Icon
            name={tab.icon}
            size={20}
            color={activeTab === tab.index ? '#1DA1F2' : theme.textSecondary}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default ProfileTabs;
