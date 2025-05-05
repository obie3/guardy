import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import MainTabNavigator from './MainTabNavigator';
import AuthNavigator from './AuthNavigator';
import LoadingScreen from '../screens/common/LoadingScreen';
import { RootStackParamList } from '../types/navigation';
import ScanNavigator from './ScanNavigator';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const { authState } = useAuth();

  // Show loading screen while checking auth status
  if (authState.loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!authState.deviceRegistered ? (
        // Show device registration if device is not registered
        <Stack.Screen 
          name="Auth" 
          component={AuthNavigator} 
          initialParams={{ screen: 'DeviceRegistration' }} 
        />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="Scanner" component={ScanNavigator} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;