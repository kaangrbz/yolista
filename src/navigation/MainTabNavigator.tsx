import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PlatformPressable } from '@react-navigation/elements';
import { TabBarIcon } from '../components/icons/tab/TabBarIcons';
import { TabBarNotificationIcon } from '../components/icons/tab/TabBarNotificationIcon';

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
import AchievementsScreen from '../screens/AchievementsScreen';
import type { AchievementsRouteParams } from '../types/achievementsNavigation';
import type { SocialUserListRouteParams } from '../types/socialUserList';
import { VerifyEmailScreen } from '../screens/VerifyEmailScreen';
import { useAppTheme } from '../context/AppThemeContext';
import { AppTabBar } from './AppTabBar';
import { buildProfileNavigationParams } from '../utils/profileSlug';
import type { RouteDetailParams } from '../types/routeDetailNavigation.types';

type ProfileStackParamList = {
  ProfileMain: { username?: string; currentUserId?: string };
  Achievements: AchievementsRouteParams;
  RouteDetail: RouteDetailParams;
  Explore: { categoryId?: number };
  SocialUserList: SocialUserListRouteParams;
  VerifyEmail: { email?: string; verifiedFromLink?: boolean };
};

type HomeStackParamList = {
  HomeMain: {
    scrollToTop?: boolean;
    showSuccessMessage?: boolean;
    successMessage?: string;
  } | undefined;
  RouteDetail: RouteDetailParams;
  AddCategory: undefined;
  Explore: { categoryId?: number };
  ProfileMain: { username: string; currentUserId?: string };
  Achievements: AchievementsRouteParams;
  SocialUserList: SocialUserListRouteParams;
};

type ExploreStackParamList = {
  ExploreMain: { categoryId?: number };
  ExploreMap: undefined;
  RouteDetail: RouteDetailParams;
  ProfileMain: { username: string; currentUserId?: string };
  Achievements: AchievementsRouteParams;
  SocialUserList: SocialUserListRouteParams;
};

export type MainTabParamList = {
  HomeStack: NavigatorScreenParams<HomeStackParamList>;
  ExploreStack: NavigatorScreenParams<ExploreStackParamList>;
  CreateRoute: undefined;
  Notifications: undefined;
  ProfileStack: NavigatorScreenParams<ProfileStackParamList>;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ExploreStack = createNativeStackNavigator<ExploreStackParamList>();

const TAB_ICON_SIZE = 26;
const CREATE_TAB_ICON_SIZE = 30;

const useTabStackScreenOptions = () => {
  const theme = useAppTheme();

  return {
    headerShown: false,
    animation: 'slide_from_right' as const,
    contentStyle: { backgroundColor: theme.background },
  };
};

const ProfileStackScreen = () => {
  const { user } = useAuth();
  const currentUserId = user?.id || '';
  const currentUsername = user?.profile?.username || '';
  const tabStackScreenOptions = useTabStackScreenOptions();

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
        name="Achievements"
        component={AchievementsScreen}
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
    </ProfileStack.Navigator>
  );
};

const HomeStackScreen = () => {
  const tabStackScreenOptions = useTabStackScreenOptions();

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
        name="Achievements"
        component={AchievementsScreen}
      />
      <HomeStack.Screen
        name="SocialUserList"
        component={SocialUserListRouteScreen}
      />
    </HomeStack.Navigator>
  );
};

const ExploreStackScreen = () => {
  const tabStackScreenOptions = useTabStackScreenOptions();

  return (
    <ExploreStack.Navigator
      initialRouteName="ExploreMap"
      screenOptions={tabStackScreenOptions}
    >
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
        name="Achievements"
        component={AchievementsScreen}
      />
      <ExploreStack.Screen
        name="SocialUserList"
        component={SocialUserListRouteScreen}
      />
    </ExploreStack.Navigator>
  );
};

const MainTabNavigator = () => {
  const theme = useAppTheme();
  const { user } = useAuth();
  const currentUserId = user?.id ?? '';
  const currentUsername = user?.profile?.username ?? '';

  return (
    <Tab.Navigator
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: theme.textPrimary,
        tabBarInactiveTintColor: theme.textMuted,
        headerShown: false,
        tabBarShowLabel: false,
        sceneStyle: {
          backgroundColor: theme.background,
        },
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
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarNotificationIcon
              color={color}
              focused={focused}
              size={TAB_ICON_SIZE}
            />
          ),
          tabBarAccessibilityLabel: 'Bildirimler',
        }}
      />
      <Tab.Screen
        name="ProfileStack"
        component={ProfileStackScreen}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            const tabState = navigation.getState();
            const isProfileTabFocused = tabState.routes[tabState.index]?.key === route.key;

            if (!isProfileTabFocused || !currentUsername) {
              return;
            }

            const profileStackRoute = tabState.routes.find(
              (tabRoute) => tabRoute.name === 'ProfileStack',
            );
            const stackState = profileStackRoute?.state;
            const activeStackRoute = stackState?.routes[stackState.index ?? 0];
            const activeParams = activeStackRoute?.params as { username?: string } | undefined;

            const isAlreadyOnOwnProfile =
              stackState?.index === 0 &&
              activeStackRoute?.name === 'ProfileMain' &&
              (!activeParams?.username || activeParams.username === currentUsername);

            if (isAlreadyOnOwnProfile) {
              return;
            }

            e.preventDefault();

            navigation.navigate('ProfileStack', {
              screen: 'ProfileMain',
              params: buildProfileNavigationParams({
                username: currentUsername,
                currentUserId,
              }),
            });
          },
        })}
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
