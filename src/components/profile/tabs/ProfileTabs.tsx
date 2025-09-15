import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type TabType = 'posts' | 'saved' | 'tagged';

interface ProfileTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  onTabChange,
  fadeAnim,
  scaleAnim,
}) => {
  const tabs = [
    {
      key: 'posts' as TabType,
      icon: 'view-comfortable',
      iconType: 'MaterialIcons' as const,
      label: 'Gönderiler',
      color: '#667eea',
    },
    {
      key: 'saved' as TabType,
      icon: 'bookmark-outline',
      iconType: 'MaterialCommunityIcons' as const,
      label: 'Kaydedilenler',
      color: '#f5576c',
    },
    {
      key: 'tagged' as TabType,
      icon: 'tag-outline',
      iconType: 'MaterialCommunityIcons' as const,
      label: 'Etiketler',
      color: '#4facfe',
    },
  ];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const IconComponent = tab.iconType === 'MaterialIcons' ? MaterialIcons : Icon;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => onTabChange(tab.key)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.tabIconContainer,
                isActive && { backgroundColor: tab.color },
              ]}>
                <IconComponent
                  name={tab.icon}
                  size={20}
                  color={isActive ? '#fff' : '#666'}
                />
              </View>
              <Text style={[
                styles.tabLabel,
                isActive && styles.activeTabLabel,
              ]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    position: 'relative',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    backgroundColor: '#f0f0f0',
  },
  tabLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  activeTabLabel: {
    color: '#333',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 4,
    left: '50%',
    marginLeft: -12,
    width: 24,
    height: 3,
    backgroundColor: '#1DA1F2',
    borderRadius: 2,
  },
});

export default ProfileTabs;
