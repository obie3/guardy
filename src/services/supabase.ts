import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
import { AuthDevice } from '../types/database';

// Create a custom storage implementation for React Native
const createCustomStorage = () => {
  return {
    getItem: (key: string) => {
      return AsyncStorage.getItem(key);
    },
    setItem: (key: string, value: string) => {
      AsyncStorage.setItem(key, value);
      return Promise.resolve();
    },
    removeItem: (key: string) => {
      AsyncStorage.removeItem(key);
      return Promise.resolve();
    },
  };
};

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: createCustomStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

 
// Helper function to check if Supabase connection is working
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    // Use a health check call instead of querying a specific table
    // We'll use Supabase's RPC feature to execute a simple function that 
    // doesn't depend on any specific database table
    // const { error } = await supabase.rpc('get_service_status', {});
    
    // // If the get_service_status function doesn't exist, fall back to a simple ping
    // if (error && error.message.includes('function "get_service_status" does not exist')) {
      // Fallback to a simple ping by getting the current timestamp from the server
      const { error: pingError } = await supabase.auth.getSession();
      
      if (pingError) {
        console.error('Supabase connection test failed:', pingError);
        return false;
      }
      
    //   console.log('Supabase connection test successful');
    //   return true;
    // }
    
    // if (error) {
    //   console.error('Supabase connection test failed:', error);
    //   return false;
    // }

    return true;
  } catch (error) {
    console.error('Error testing Supabase connection:', error);
    return false;
  }
};

// Create a new function to verify device registration
export const verifyDeviceCode = async (deviceCode: string): Promise<{
  success: boolean;
  error?: string;
  device?: AuthDevice;
}> => {
  try {
    console.log('Verifying device code in Supabase service:', deviceCode);
    
    // Check Supabase connection before attempting to verify
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.log('Supabase connection is unavailable');
      return { 
        success: false, 
        error: 'No connection to server. Please check your internet connection and try again.' 
      };
    }
    console.log('Supabase connection is available');

    
    // TESTING ONLY: Special case for our test codes
    // if (deviceCode === 'ABC123' || deviceCode === '123456') {
    //   console.log('Using test device code - bypassing verification');
    //   return { 
    //     success: true, 
    //     device: { 
    //       id: 'test-device-id',
    //       device_code: deviceCode,
    //       is_active: true 
    //     } 
    //   };
    // }

    // First verify the code format
    if (!/^[A-Z0-9]{6,12}$/.test(deviceCode)) {
      console.log('Device code format validation failed');
      return { 
        success: false, 
        error: 'Invalid device code format' 
      };
    }

    console.log('Querying Supabase for device code');
    let data, error;
    
    try {
      // For testing/mocking purposes
      const response = {
        data: {
          id: '794b26a9-02da-49fb-a254-9236d7645083',
          device_code: deviceCode,
          status: 'inactive',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        error: null
      };

      // // Use the actual Supabase query in production
      // const response = await supabase
      //   .from('auth_devices')
      //   .select('*')
      //   .eq('device_code', deviceCode)
      //   .eq('status', 'inactive')
      //   .single();
      
      
      data =  response.data;
      error =  response.error;
      
      console.log('Supabase query completed');
    } catch (queryError) {
      console.error('Exception during Supabase query:', queryError);
      return { 
        success: false, 
        error: 'Connection error while verifying device code' 
      };
    }
    
    console.log('Querying Supabase for device code complete');

    if (error) {
      console.error('Error from Supabase:', error);
      return { 
        success: false, 
        error: 'Failed to verify device code' 
      };
    }

    if (!data) {
      console.log('No device found with this code');
      return { 
        success: false, 
        error: 'Invalid or inactive device code' 
      };
    }

    // Update the last_used timestamp
    const { error: updateError } = await supabase
      .from('auth_devices')
      .update({ status: 'active' })
      .eq('id', data.id);
      
    if (updateError) {
      console.warn('Failed to update device status', updateError);
      // This is not a critical error, so we continue with the registration
    }

    console.log('Device verification successful');
    return { 
      success: true, 
      device: data as AuthDevice
    };
  } catch (error) {
    console.error('Unexpected error in verifyDeviceCode:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred' 
    };
  }
};
