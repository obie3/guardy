import * as React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DeviceRegistrationScreen from '../screens/auth/DeviceRegistrationScreen';
import { AuthStackParamList } from '../types/navigation';
import { useTheme } from '../context/ThemeContext';

const Stack = createStackNavigator<AuthStackParamList>();

const AuthNavigator = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background.primary },
      }}
    >
      <Stack.Screen 
        name="DeviceRegistration" 
        component={DeviceRegistrationScreen}
        options={{
          gestureEnabled: false,
          headerLeft: null,
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
