import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { verifyDeviceCode } from '../services/supabase';
import { AuthDevice } from '../types/database';

// Define auth state type
type AuthState = {
  loading: boolean;
  deviceRegistered: boolean;
  deviceCode: string | null;
  deviceInfo: AuthDevice | null;
  showSuccessScreen: boolean; // Add this new property to control when to show success screen
};

// Define context value type
type AuthContextValue = {
  authState: AuthState;
  registerDevice: (
    deviceCode: string
  ) => Promise<{ success: boolean; error?: string }>;
  continueToMainApp: () => void; // Add this method to control navigation to main app
};

// Create the context
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Create a storage mechanism that works on both web and native
const storage =
  Platform.OS === 'web'
    ? AsyncStorage
    : {
        getItem: (key: string) => SecureStore.getItemAsync(key),
        setItem: (key: string, value: string) =>
          SecureStore.setItemAsync(key, value),
        removeItem: (key: string) => SecureStore.deleteItemAsync(key),
      };

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    loading: true,
    deviceRegistered: false,
    deviceCode: null,
    deviceInfo: null,
    showSuccessScreen: false,
  });

  // Initialize auth state on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check device registration
        const deviceCode = await storage.getItem('device_code');
        const deviceInfoStr = await storage.getItem('device_info');
        let deviceInfo: AuthDevice | null = null;
        
        if (deviceInfoStr) {
          try {
            deviceInfo = JSON.parse(deviceInfoStr);
          } catch (e) {
            console.error('Failed to parse stored device info:', e);
          }
        }
        
        const deviceRegistered = Boolean(deviceCode);

        setAuthState({
          loading: false,
          deviceRegistered: deviceRegistered,
          deviceCode: deviceCode,
          deviceInfo: deviceInfo,
          showSuccessScreen: false,
        });
      } catch (error) {
        console.error('Unexpected error during auth initialization:', error);
        setAuthState({
          loading: false,
          deviceRegistered: false,
          deviceCode: null,
          deviceInfo: null,
          showSuccessScreen: false,
        });
      }
    };

    initializeAuth();
  }, []);

  // Register device function
  const registerDevice = async (deviceCode: string) => {
    try {
      // If deviceCode is empty, treat this as an unregister operation
      if (!deviceCode) {
        await storage.removeItem('device_code');
        await storage.removeItem('device_info');
        setAuthState({
          loading: false,
          deviceRegistered: false,
          deviceCode: null,
          deviceInfo: null,
          showSuccessScreen: false,
        });
        return { success: true };
      }

      const result = await verifyDeviceCode(deviceCode);

      if (result.success && result.device) {
        // Store the device code
        await storage.setItem('device_code', deviceCode);
        
        // Store the full device info as JSON
        if (result.device) {
          await storage.setItem('device_info', JSON.stringify(result.device));
        }
        
        // Set to registered with showSuccessScreen = true to show success view
        setAuthState({
          loading: false,
          deviceRegistered: true,
          deviceCode: deviceCode,
          deviceInfo: result.device,
          showSuccessScreen: true,
        });
        return { success: true };
      }

      return { success: false, error: result.error };
    } catch (error) {
      console.error('Error registering device:', error);
      return { success: false, error: 'Failed to register device' };
    }
  };

  // Add function to continue to main app after seeing success screen
  const continueToMainApp = () => {
    console.log('Continuing to main app');
    setAuthState(prev => ({
      ...prev,
      showSuccessScreen: false, // This will trigger navigation to main app
    }));
  };

  const value: AuthContextValue = {
    authState,
    registerDevice,
    continueToMainApp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
