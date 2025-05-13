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
import { useSync } from './SyncContext';

// Define auth state type
type AuthState = {
  loading: boolean;
  deviceRegistered: boolean;
  deviceCode: string | null;
  deviceInfo: AuthDevice | null;
  estateInfo: Estate | null;
  showSuccessScreen: boolean; // Add this new property to control when to show success screen
};

// Create web storage interface
interface StorageInterface {
  setItem: (key: string, value: string) => Promise<void>;
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
}

// Create web storage implementation
const webStorage: StorageInterface = {
  setItem: async (key: string, value: string) => await AsyncStorage.setItem(key, value),
  getItem: async (key: string) => await AsyncStorage.getItem(key),
  removeItem: async (key: string) => await AsyncStorage.removeItem(key),
};

// Create native storage implementation
const nativeStorage: StorageInterface = {
  setItem: async (key: string, value: string) => await SecureStore.setItemAsync(key, value),
  getItem: async (key: string) => await SecureStore.getItemAsync(key),
  removeItem: async (key: string) => await SecureStore.deleteItemAsync(key),
};

// Define context value type
type AuthContextValue = {
  authState: AuthState;
  loading: boolean;
  registerDevice: (
    deviceCode: string
  ) => Promise<{ success: boolean; error?: string }>;
  continueToMainApp: () => void; // Add this new function type
  storage: StorageInterface;
};

// Create the context
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Provider component
export const AuthProvider = ({ 
  children,
}: { 
  children: ReactNode;
}) => {
  const { forceSyncNow } = useSync();
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
        const deviceCode = await webStorage.getItem('device_code');
        const deviceInfoStr = await webStorage.getItem('device_info');
        const estateInfoStr = await webStorage.getItem('estate_info');
        
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
        await webStorage.removeItem('device_code');
        await webStorage.removeItem('device_info');
        await webStorage.removeItem('estate_info');
        
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
          .select('*')
          .eq('id', result.device.estate_id)
          .single();

        if (estateError) {
          console.error('Failed to fetch estate info:', estateError);
          return { success: false, error: 'Failed to fetch estate information' };
        }

        // Save the device code to secure storage
        await webStorage.setItem('device_code', deviceCode);
        await webStorage.setItem('device_info', JSON.stringify(result.device));
        await webStorage.setItem('estate_info', JSON.stringify(estate));

        // Update auth state
        setAuthState({
          loading: false,
          deviceRegistered: true,
          deviceCode: deviceCode,
          deviceInfo: result.device,
          estateInfo: estate,
          showSuccessScreen: true,
        });

        // Trigger initial sync after successful registration
        if (result.device.id) {
          await forceSyncNow(result.device.id);
        }

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

  // Get the correct storage implementation
  const storage = Platform.OS === 'web' ? webStorage : nativeStorage;

  // Context value
  const value: AuthContextValue = {
    authState,
    loading: authState.loading,
    registerDevice,
    continueToMainApp,
    storage,
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
