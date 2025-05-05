import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../context/ThemeContext';
import HomeScreen from '../screens/home/HomeScreen';
import LogsScreen from '../screens/logs/LogsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import { MainTabParamList } from '../types/navigation';
import { Chrome as Home, ClipboardList, User, Settings2Icon, Settings } from 'lucide-react-native';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator = () => {
  const { theme } = useTheme();

  // Helper to determine if tab bar and header should be hidden
  const getTabBarAndHeaderOptions = (route: any) => {
    const routeName = getFocusedRouteNameFromRoute(route) ?? '';
    const hide = routeName === 'EntercodeScreen' || routeName === 'VerificationScreen';
    return {
      tabBarStyle: hide
        ? { display: 'none' }
        : {
            backgroundColor: theme.colors.background.primary,
            borderTopColor: theme.colors.border,
            elevation: 0,
            shadowOpacity: 0,
            height: 60,
            paddingBottom: 8,
          },
      headerShown: !hide,
    };
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background.primary,
          borderTopColor: theme.colors.border,
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
          paddingBottom: 8,
        },
        headerStyle: {
          backgroundColor: theme.colors.background.primary,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTitleStyle: {
          fontFamily: 'Poppins-SemiBold',
          fontSize: 18,
          color: theme.colors.text.primary,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          headerTitle: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Logs"
        component={LogsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} />,
          headerTitle: 'Access Logs',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
          headerTitle: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
