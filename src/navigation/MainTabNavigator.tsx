import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PlatformPressable } from '@react-navigation/elements';
import { TabBarIcon } from '../components/icons/tab/TabBarIcons';

import { HomeScreen } from '../screens/HomeScreen';
import { CreateRouteStack } from './CreateRouteStack';
import ProfileScreen from '../screens/ProfileScreen';
import { RouteDetailScreen } from '../screens/RouteDetailScreen';
import { AddCategoryScreen } from '../screens/AddCategoryScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ExploreScreen from '../screens/ExploreScreen';
import ExploreMapScreen from '../screens/Explore/ExploreMapScreen';
import { useAuth } from '../context/AuthContext';
import { SocialUserListRouteScreen } from '../screens/SocialUserListRouteScreen';
import type { SocialUserListRouteParams } from '../types/socialUserList';
import { VerifyEmailScreen } from '../screens/VerifyEmailScreen';
import { useAppTheme } from '../context/AppThemeContext';
import { AppTabBar } from './AppTabBar';

type ProfileStackParamList = {
  ProfileMain: { username?: string; currentUserId?: string };
  RouteDetail: { routeId: string };
  Explore: { categoryId?: number };
  SocialUserList: SocialUserListRouteParams;
  VerifyEmail: { email?: string; verifiedFromLink?: boolean };
  Notifications: undefined;
};

type HomeStackParamList = {
  HomeMain: {
    scrollToTop?: boolean;
    showSuccessMessage?: boolean;
    successMessage?: string;
  } | undefined;
  RouteDetail: { routeId: string };
  AddCategory: undefined;
  Explore: { categoryId?: number };
  ProfileMain: { username: string; currentUserId?: string };
  SocialUserList: SocialUserListRouteParams;
  Notifications: undefined;
};

type ExploreStackParamList = {
  ExploreMain: { categoryId?: number };
  ExploreMap: undefined;
  RouteDetail: { routeId: string };
  ProfileMain: { username: string; currentUserId?: string };
  SocialUserList: SocialUserListRouteParams;
  Notifications: undefined;
};

const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ExploreStack = createNativeStackNavigator<ExploreStackParamList>();

const TAB_ICON_SIZE = 26;
const CREATE_TAB_ICON_SIZE = 30;

const tabStackScreenOptions = {
  headerShown: false,
  animation: 'slide_from_right' as const,
};

const ProfileStackScreen = () => {
  const { user } = useAuth();
  const currentUserId = user?.id || '';
  const currentUsername = user?.profile?.username || '';

  return (
    <ProfileStack.Navigator screenOptions={tabStackScreenOptions}>
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        initialParams={{
          username: currentUsername,
          currentUserId: currentUserId,
        }}
      />
      <ProfileStack.Screen
        name="RouteDetail"
        component={RouteDetailScreen}
      />
      <ProfileStack.Screen
        name="Explore"
        component={ExploreScreen}
      />
      <ProfileStack.Screen
        name="SocialUserList"
        component={SocialUserListRouteScreen}
      />
      <ProfileStack.Screen
        name="VerifyEmail"
        component={VerifyEmailScreen}
      />
      <ProfileStack.Screen
        name="Notifications"
        component={NotificationsScreen}
      />
    </ProfileStack.Navigator>
  );
};

const HomeStackScreen = () => {
  return (
    <HomeStack.Navigator screenOptions={tabStackScreenOptions}>
      <HomeStack.Screen
        name="HomeMain"
        component={HomeScreen}
      />
      <HomeStack.Screen
        name="RouteDetail"
        component={RouteDetailScreen}
      />
      <HomeStack.Screen
        name="AddCategory"
        component={AddCategoryScreen}
      />
      <HomeStack.Screen
        name="Explore"
        component={ExploreScreen}
      />
      <HomeStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
      />
      <HomeStack.Screen
        name="SocialUserList"
        component={SocialUserListRouteScreen}
      />
      <HomeStack.Screen
        name="Notifications"
        component={NotificationsScreen}
      />
    </HomeStack.Navigator>
  );
};

const ExploreStackScreen = () => {
  return (
    <ExploreStack.Navigator screenOptions={tabStackScreenOptions}>
      <ExploreStack.Screen
        name="ExploreMain"
        component={ExploreScreen}
      />
      <ExploreStack.Screen
        name="ExploreMap"
        component={ExploreMapScreen}
      />
      <ExploreStack.Screen
        name="RouteDetail"
        component={RouteDetailScreen}
      />
      <ExploreStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
      />
      <ExploreStack.Screen
        name="SocialUserList"
        component={SocialUserListRouteScreen}
      />
      <ExploreStack.Screen
        name="Notifications"
        component={NotificationsScreen}
      />
    </ExploreStack.Navigator>
  );
};

const MainTabNavigator = () => {
  const theme = useAppTheme();

  return (
    <Tab.Navigator
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: theme.textPrimary,
        tabBarInactiveTintColor: theme.textMuted,
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.background,
        },
        tabBarButton: (props) => (
          <PlatformPressable
            {...props}
            android_ripple={{ color: 'transparent' }}
          />
        ),
      }}
    >
      <Tab.Screen
        name="HomeStack"
        component={HomeStackScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="home" color={color} focused={focused} size={TAB_ICON_SIZE} />
          ),
        }}
      />
      <Tab.Screen
        name="ExploreStack"
        component={ExploreStackScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="explore" color={color} focused={focused} size={TAB_ICON_SIZE} />
          ),
        }}
      />
      <Tab.Screen
        name="CreateRoute"
        component={CreateRouteStack}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name="create"
              color={color}
              focused={focused}
              size={CREATE_TAB_ICON_SIZE}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileStack"
        component={ProfileStackScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="profile" color={color} focused={focused} size={TAB_ICON_SIZE} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
