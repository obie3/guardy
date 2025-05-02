import * as React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ScannerStackParamList } from '../types/navigation';
import { useTheme } from '../context/ThemeContext';
import { ScannerScreen } from '../screens/scanner/ScannerScreen';
import { EntercodeScreen } from '../screens/scanner/EntercodeScreen';
import { VerificationScreen } from '../screens/scanner/VerificationScreen';

const Stack = createStackNavigator<ScannerStackParamList>();

const ScanNavigator = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background.primary },
      }}
    >
      <Stack.Screen name={'ScanQR'} component={ScannerScreen} />
      <Stack.Screen name={'EntercodeScreen'} component={EntercodeScreen} />
      <Stack.Screen
        name={'VerificationScreen'}
        component={VerificationScreen}
      />
    </Stack.Navigator>
  );
};

export default ScanNavigator;
