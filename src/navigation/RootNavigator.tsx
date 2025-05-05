import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import MainTabNavigator from './MainTabNavigator';
import AuthNavigator from './AuthNavigator';
import LoadingScreen from '../screens/common/LoadingScreen';
import { RootStackParamList } from '../types/navigation';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const { authState } = useAuth();
  
  // Show loading screen while checking auth status
  if (authState.loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!authState.deviceRegistered || authState.showSuccessScreen ? (
        // Show auth navigator if device is not registered OR if we need to show the success screen
        <Stack.Screen 
          name="Auth" 
          component={AuthNavigator} 
          initialParams={{ screen: 'DeviceRegistration' }} 
        />
      ) : (
        // Only show main app when device is registered AND success screen has been dismissed
        <Stack.Screen name="Main" component={MainTabNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;