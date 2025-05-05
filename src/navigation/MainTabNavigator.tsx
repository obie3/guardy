import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import HomeScreen from '../screens/home/HomeScreen';
import LogsScreen from '../screens/logs/LogsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import { MainTabParamList, ScannerStackParamList } from '../types/navigation';
import { Chrome as Home, ClipboardList, Settings, Scan, VerifiedIcon, CheckCheckIcon, DoorOpen, DoorClosedIcon } from 'lucide-react-native';
import { ScannerScreen } from '../screens/scanner/ScannerScreen';
import { EntercodeScreen } from '../screens/scanner/EntercodeScreen';
import { VerificationScreen } from '../screens/scanner/VerificationScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const ScannerStack = createStackNavigator<ScannerStackParamList>();

const ScannerStackScreen = () => {
  const { theme } = useTheme();
  return (
    <ScannerStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background.primary },
      }}
    >
      <ScannerStack.Screen name="ScanQR" component={ScannerScreen} />
      <ScannerStack.Screen name="EntercodeScreen" component={EntercodeScreen} />
      <ScannerStack.Screen name="VerificationScreen" component={VerificationScreen} />
    </ScannerStack.Navigator>
  );
};

const MainTabNavigator = () => {
  const { theme } = useTheme();

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
        name="Scanner"
        component={ScannerStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => <DoorClosedIcon size={size} color={color} />,
          headerShown: false,
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
