import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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
  const tabs = [
    { index: 0, icon: 'grid', label: 'Grid' },
    { index: 1, icon: 'format-list-bulleted', label: 'List' },
  ];

  if (isCurrentUserProfile) {
    tabs.push(
      { index: 2, icon: 'bookmark', label: 'Saved' },
      { index: 3, icon: 'heart', label: 'Liked' }
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
            color={activeTab === tab.index ? '#1DA1F2' : '#666'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    // paddingTop: 12, // wont enable this
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
});

export default ProfileTabs;
