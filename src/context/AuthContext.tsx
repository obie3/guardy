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

// Define auth state type
type AuthState = {
  loading: boolean;
  deviceRegistered: boolean;
  deviceCode: string | null;
};

// Define context value type
type AuthContextValue = {
  authState: AuthState;
  registerDevice: (
    deviceCode: string
  ) => Promise<{ success: boolean; error?: string }>;
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
  });

  // Initialize auth state on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check device registration
        const deviceCode = await storage.getItem('device_code');
        const deviceRegistered = Boolean(deviceCode);

        setAuthState({
          loading: false,
          deviceRegistered: deviceRegistered,
          deviceCode: deviceCode,
        });
      } catch (error) {
        console.error('Unexpected error during auth initialization:', error);
        setAuthState({
          loading: false,
          deviceRegistered: false,
          deviceCode: null,
        });
      }
    };

    initializeAuth();
  }, []);

  // Register device function
  const registerDevice = async (deviceCode: string) => {
    try {
      const result = await verifyDeviceCode(deviceCode);

      if (result.success) {
        await storage.setItem('device_code', deviceCode);
        setAuthState({
          loading: false,
          deviceRegistered: true,
          deviceCode: deviceCode,
        });
        return { success: true };
      }

      return { success: false, error: result.error };
    } catch (error) {
      console.error('Error registering device:', error);
      return { success: false, error: 'Failed to register device' };
    }
  };

  const value: AuthContextValue = {
    authState,
    registerDevice,
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
