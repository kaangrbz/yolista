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

const Tab = createBottomTabNavigator();
const ProfileStack = createStackNavigator();
const HomeStack = createStackNavigator();

// Create a stack navigator for the Profile tab to handle its own navigation
const ProfileStackScreen = () => {
  // You would typically get the current user ID from your auth context
  const currentUserId = 'current-user-id'; // Replace with actual user ID from your auth context

  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        initialParams={{
          userId: currentUserId,
          currentUserId: currentUserId,
          // Add other required props here
        }}
      />
    </ProfileStack.Navigator>
  );
};

// Create a stack navigator for the Home tab
const HomeStackScreen = () => {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="RouteDetail" component={RouteDetailScreen} />
      <HomeStack.Screen name="AddCategory" component={AddCategoryScreen} />
    </HomeStack.Navigator>
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
        name="ExploreScreen"
        component={ExploreScreen}
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="map-marker-radius" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="CreateRoute"
        component={CreateRouteScreen}
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="plus-circle" color={color} size={size} />
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
