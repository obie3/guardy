import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { verifyDeviceCode } from '../services/supabase';
import { AuthDevice, Estate } from '../types/database';
import { supabase } from '../services/supabase';

// Define auth state type
type AuthState = {
  loading: boolean;
  deviceRegistered: boolean;
  deviceCode: string | null;
  deviceInfo: AuthDevice | null;
  estateInfo: Estate | null;
  showSuccessScreen: boolean; // Add this new property to control when to show success screen
};

// Define context value type
type AuthContextValue = {
  authState: AuthState;
  registerDevice: (
    deviceCode: string
  ) => Promise<{ success: boolean; error?: string }>;
  continueToMainApp: () => void; // Add this new function type
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
    estateInfo: null,
    showSuccessScreen: false,
  });

  // Initialize auth state on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check device registration
        const deviceCode = await storage.getItem('device_code');
        const deviceInfoStr = await storage.getItem('device_info');
        const estateInfoStr = await storage.getItem('estate_info');
        
        let deviceInfo: AuthDevice | null = null;
        let estateInfo: Estate | null = null;
        
        if (deviceInfoStr) {
          deviceInfo = JSON.parse(deviceInfoStr);
        }
        
        if (estateInfoStr) {
          estateInfo = JSON.parse(estateInfoStr);
        }

        setAuthState({
          loading: false,
          deviceRegistered: Boolean(deviceCode),
          deviceCode: deviceCode || null,
          deviceInfo,
          estateInfo,
          showSuccessScreen: false,
        });
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthState({
          loading: false,
          deviceRegistered: false,
          deviceCode: null,
          deviceInfo: null,
          estateInfo: null,
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
        await storage.removeItem('estate_info');
        
        setAuthState({
          loading: false,
          deviceRegistered: false,
          deviceCode: null,
          deviceInfo: null,
          estateInfo: null,
          showSuccessScreen: false,
        });
        return { success: true };
      }

      const result = await verifyDeviceCode(deviceCode);

      if (result.success && result.device) {
        // Fetch estate information
        const { data: estate, error: estateError } = await supabase
          .from('estates')
          .select('id, name, address, created_at, updated_at')
          .eq('id', result.device.estate_id)
          .single();

        if (estateError) {
          console.error('Error fetching estate info:', estateError);
          return { success: false, error: 'Failed to fetch estate information' };
        }

        // Store the device code
        await storage.setItem('device_code', deviceCode);
        
        // Store the full device info as JSON
        if (result.device) {
          await storage.setItem('device_info', JSON.stringify(result.device));
        }

        // Store the estate info
        if (estate) {
          await storage.setItem('estate_info', JSON.stringify(estate));
        }
        
        // Set to registered with showSuccessScreen = true to show success view
        setAuthState({
          loading: false,
          deviceRegistered: true,
          deviceCode: deviceCode,
          deviceInfo: result.device,
          estateInfo: estate,
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

  const continueToMainApp = () => {
    setAuthState(prev => ({
      ...prev,
      showSuccessScreen: false
    }));
  };

  const value: AuthContextValue = {
    authState,
    registerDevice,
    continueToMainApp, // Add the function to the context value
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
