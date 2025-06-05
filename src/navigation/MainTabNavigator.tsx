import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { PlatformPressable } from '@react-navigation/elements';

// Import your screens
import { HomeScreen } from '../screens/HomeScreen';
import { CreateRouteScreen } from '../screens/CreateRouteScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { RouteDetailScreen } from '../screens/RouteDetailScreen';
import { AddCategoryScreen } from '../screens/AddCategoryScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ExploreScreen from '../screens/ExploreScreen';
import { useAuth } from '../context/AuthContext';
import { FollowingScreen } from '../screens/FollowingScreen';
import { FollowersScreen } from '../screens/FollowersScreen';

// Define the parameter lists for each stack
type ProfileStackParamList = {
  ProfileMain: { userId: string; currentUserId: string };
  RouteDetail: { routeId: string };
  Explore: { categoryId?: number };
  Followers: { userId: string };
  Following: { userId: string };
};

type HomeStackParamList = {
  HomeMain: undefined;
  RouteDetail: { routeId: string };
  AddCategory: undefined;
  Explore: { categoryId?: number };
  ProfileMain: { userId: string; currentUserId: string };
  Followers: { userId: string };
  Following: { userId: string };
};

type ExploreStackParamList = {
  ExploreMain: { categoryId?: number };
  RouteDetail: { routeId: string };
  ProfileMain: { userId: string; currentUserId: string };
  Followers: { userId: string };
  Following: { userId: string };
};

type NotificationStackParamList = {
  NotificationMain: undefined,
  RouteDetail: { routeId: string },
  ProfileMain: { userId: string; currentUserId: string },
  Followers: { userId: string },
  Following: { userId: string },
};

const Tab = createBottomTabNavigator();
const ProfileStack = createStackNavigator<ProfileStackParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();
const ExploreStack = createStackNavigator<ExploreStackParamList>();
const NotificationStack = createStackNavigator<NotificationStackParamList>();

// Create a stack navigator for the Profile tab to handle its own navigation
const ProfileStackScreen = () => {
  // You would typically get the current user ID from your auth context
  const currentUserId = useAuth().user?.id || '';

  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        initialParams={{
          userId: currentUserId,
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
        name="Followers" 
        component={FollowersScreen} 
      />
      <ProfileStack.Screen 
        name="Following" 
        component={FollowingScreen} 
      />  
    </ProfileStack.Navigator>
  );
};

// Create a stack navigator for the Home tab
const HomeStackScreen = () => {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
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
        name="Followers" 
        component={FollowersScreen} 
      />
      <HomeStack.Screen 
        name="Following" 
        component={FollowingScreen} 
      />  
    </HomeStack.Navigator>
  );
};

// Create a stack navigator for the Explore tab
const ExploreStackScreen = () => {
  return (
    <ExploreStack.Navigator screenOptions={{ headerShown: false }}>
      <ExploreStack.Screen 
        name="ExploreMain" 
        component={ExploreScreen} 
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
        name="Followers" 
        component={FollowersScreen} 
      />
      <ExploreStack.Screen 
        name="Following" 
        component={FollowingScreen} 
      />  
    </ExploreStack.Navigator>
  );
};

// Create a stack navigator for the Explore tab
const NotificationStackScreen = () => {
  return (
    <NotificationStack.Navigator screenOptions={{ headerShown: false }}>
      <NotificationStack.Screen 
        name="NotificationMain" 
        component={NotificationsScreen} 
      />
      <NotificationStack.Screen 
        name="RouteDetail" 
        component={RouteDetailScreen} 
      />
      <NotificationStack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
      />
      <NotificationStack.Screen 
        name="Followers" 
        component={FollowersScreen} 
      />
      <NotificationStack.Screen 
        name="Following" 
        component={FollowingScreen} 
      />  
    </NotificationStack.Navigator>
  );
};

const MainTabNavigator = () => {
  const {unreadNotificationCount} = useAuth();
  console.log("🚀 ~ MainTabNavigator ~ unreadNotificationCount:", unreadNotificationCount)

  return (
    <Tab.Navigator
      screenOptions={(props) => ({
        tabBarActiveTintColor: '#121212',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 5,
          // height: 50,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,
        },
        tabBarButton: (props) => (
          <PlatformPressable
            {...props}
            android_ripple={{ color: 'transparent' }}  // Disables the ripple effect for Android
          />
        ),
      })}
    >
      <Tab.Screen
        name="HomeStack"
        component={HomeStackScreen}
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ExploreStack"
        component={ExploreStackScreen}
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcon name="search" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="CreateRoute"
        component={CreateRouteScreen}
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="leaf-circle-outline" color={color} size={size * 1.25} />
          ),
        }}
      />
      <Tab.Screen
        name="NotificationScreen"
        component={NotificationStackScreen}
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="bell" color={color} size={size} />
          ),
          tabBarBadge: unreadNotificationCount,
        }}
      />
      <Tab.Screen
        name="ProfileStack"
        component={ProfileStackScreen}
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
