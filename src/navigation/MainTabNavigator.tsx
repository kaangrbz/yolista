import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import your screens
import { HomeScreen } from '../screens/HomeScreen';
import { CreateRouteScreen } from '../screens/CreateRouteScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { RouteDetailScreen } from '../screens/RouteDetailScreen';
import { AddCategoryScreen } from '../screens/AddCategoryScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ExploreScreen from '../screens/ExploreScreen';
import { useAuth } from '../context/AuthContext';

// Define the parameter lists for each stack
type ProfileStackParamList = {
  ProfileMain: { userId: string; currentUserId: string };
  RouteDetail: { routeId: string };
  Explore: { categoryId?: number };
};

type HomeStackParamList = {
  HomeMain: undefined;
  RouteDetail: { routeId: string };
  AddCategory: undefined;
  Explore: { categoryId?: number };
  ProfileMain: { userId: string; currentUserId: string };
};

type ExploreStackParamList = {
  ExploreMain: { categoryId?: number };
  RouteDetail: { routeId: string };
  ProfileMain: { userId: string; currentUserId: string };
};

const Tab = createBottomTabNavigator();
const ProfileStack = createStackNavigator<ProfileStackParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();
const ExploreStack = createStackNavigator<ExploreStackParamList>();

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
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen 
        name="Explore" 
        component={ExploreScreen} 
        options={{ headerShown: false }}
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
        options={{ headerShown: false }}
      />
      <ExploreStack.Screen 
        name="Explore" 
        component={ExploreScreen} 
        options={{ headerShown: false }}
      />
      <ExploreStack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
      />
    </ExploreStack.Navigator>
  );
};

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
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
      }}
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
            <Icon name="routes" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="CreateRoute"
        component={CreateRouteScreen}
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="plus-circle" color={color} size={size * 1.25} />
          ),
        }}
      />
      <Tab.Screen
        name="NotificationScreen"
        component={NotificationsScreen}
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="bell" color={color} size={size} />
          ),
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
