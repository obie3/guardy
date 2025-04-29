import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import RootNavigator from './navigation/RootNavigator';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './context/AuthContext';
import { DatabaseProvider } from './context/DatabaseContext';
import { SyncProvider } from './context/SyncContext';
import { ThemeProvider } from './context/ThemeContext';

// Keep the splash screen visible until fonts are loaded
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Any initialization logic goes here
        // e.g., loading resources, initializing databases, etc.
      } catch (e) {
        console.warn('Error initializing app:', e);
      } finally {
        // When everything is ready, notify the app
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && appIsReady) {
      // Hide splash screen when everything is ready
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, appIsReady]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Define the window.frameworkReady function required by the project
  if (typeof window !== 'undefined') {
    window.frameworkReady = () => {
      console.log('Framework is ready');
    };
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <DatabaseProvider>
            <SyncProvider>
              <NavigationContainer>
                <StatusBar style="auto" />
                <RootNavigator />
              </NavigationContainer>
            </SyncProvider>
          </DatabaseProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
