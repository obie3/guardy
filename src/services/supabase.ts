import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { createClient } from '@supabase/supabase-js';
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

// Ensure the environment variables are defined
const FINAL_SUPABASE_URL = SUPABASE_URL || process.env.SUPABASE_URL;
const FINAL_SUPABASE_ANON_KEY =
  SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!FINAL_SUPABASE_URL || !FINAL_SUPABASE_ANON_KEY) {
  throw new Error('Supabase URL and Anon Key must be defined');
}

// Create Supabase client
export const supabase = createClient(
  FINAL_SUPABASE_URL,
  FINAL_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: createCustomStorage(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (url, options) => {
        const timeout = 20000; // 20 seconds timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        return fetch(url, {
          ...options,
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));
      },
    },
  }
);

// Helper function to check if Supabase connection is working
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    // Fallback to a simple ping by getting the current timestamp from the server
    const { error: pingError } = await supabase.auth.getSession();

    if (pingError) {
      console.error('Supabase connection test failed:', pingError);

      // Check for specific network errors
      if (
        pingError.message &&
        (pingError.message.includes('Network request failed') ||
          pingError.message.includes('TypeError: Network') ||
          pingError.message.includes('Failed to fetch') ||
          pingError.message.includes('Aborted'))
      ) {
        console.error('Network connectivity issue detected');
      }

      return false;
    }

    console.log('Supabase connection test successful');
    return true;
  } catch (error: any) {
    console.error('Error testing Supabase connection:', error);

    // Check for timeout or network errors
    if (
      error.name === 'AbortError' ||
      (error.message &&
        (error.message.includes('Aborted') ||
          error.message.includes('Network request failed') ||
          error.message.includes('TypeError: Network')))
    ) {
      console.error('Network connectivity or timeout issue detected');
    }

    return false;
  }
};

// Create a new function to verify device registration
export const verifyDeviceCode = async (
  deviceCode: string
): Promise<{
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
        error:
          'No connection to server. Please check your internet connection and try again.',
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
        error: 'Invalid device code format',
      };
    }

    console.log('Querying Supabase for device code');
    let data, error;

    try {
      // For testing/mocking purposes
      // const response = {
      //   data: {
      //     id: '4591c218-fdad-42cb-b55e-5b7c7a51dade',
      //     device_code: deviceCode,
      //     status: 'inactive',
      //     estate_id: 'f2d284be-0a37-47af-a67c-ecd035f04a67',
      //     created_at: new Date().toISOString(),
      //     updated_at: new Date().toISOString()
      //   },
      //   error: null
      // };

      // // Use the actual Supabase query in production
      const response = await supabase
        .from('auth_devices')
        .select('*')
        .eq('device_code', deviceCode)
        .eq('status', 'inactive')
        .maybeSingle();

      // Let's log the count of auth_devices
      // const { count, error: countError } = await supabase.from('auth_devices').select('*', { count: 'exact', head: true });
      // console.log('Current count of auth_devices:', count);

      data = response.data;
      error = response.error;

      console.log('Supabase query completed');
    } catch (queryError: any) {
      console.error('Exception during Supabase query:', queryError);

      // Check if the error is due to a timeout (AbortError)
      if (
        queryError.name === 'AbortError' ||
        (queryError.message && queryError.message.includes('Aborted'))
      ) {
        console.error('Supabase query timed out');
        return {
          success: false,
          error:
            'Connection timeout. Please check your internet connection and try again.',
        };
      }

      return {
        success: false,
        error: 'Connection error while verifying device code',
      };
    }

    console.log('Querying Supabase for device code complete');

    if (error) {
      console.error('Error from Supabase:', error);

      // Handle network-related errors more specifically
      if (
        error.message &&
        (error.message.includes('Network request failed') ||
          error.message.includes('TypeError: Network') ||
          error.message.includes('Failed to fetch'))
      ) {
        return {
          success: false,
          error:
            'Network connection error. Please check your internet connection and try again.',
        };
      }

      return {
        success: false,
        error: 'Failed to verify device code',
      };
    }

    if (!data) {
      console.log('No device found with this code');
      return {
        success: false,
        error: 'Invalid or inactive device code',
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
      device: data as AuthDevice,
    };
  } catch (error) {
    console.error('Unexpected error in verifyDeviceCode:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
};

interface SupabaseGuestResponse {
  group_size: number;
  guest: {
    full_name: string;
    phone_number: string;
  };
}

export interface GuestInfo {
  full_name: string;
  phone_number: string;
  group_size: number;
}

export const fetchGuestInformation = async (
  access_code: string,
  resident_id: string
): Promise<{ success: boolean; data?: GuestInfo; error?: string }> => {
  try {
    console.log('Fetching guest information with:', {
      access_code,
      resident_id,
    });

    const { data, error } = await supabase
      .from('visitor_access_codes')
      .select(
        `
        group_size,
        guest:guest_id (
          full_name,
          phone_number
        )
      `
      )
      .eq('code', access_code)
      .eq('resident_id', resident_id)
      .single();

    if (error) {
      console.error('Error fetching guest information:', error);
      return {
        success: false,
        error: 'Failed to fetch guest information',
      };
    }

    console.log('Received data from Supabase:', JSON.stringify(data, null, 2));

    if (!data) {
      return {
        success: false,
        error: 'No data found',
      };
    }

    const response = data as SupabaseGuestResponse;
    if (!response.guest || typeof response.guest !== 'object') {
      return {
        success: false,
        error: 'No guest information found',
      };
    }

    if (!response.guest.full_name || !response.guest.phone_number) {
      return {
        success: false,
        error: 'Incomplete guest information',
      };
    }

    return {
      success: true,
      data: {
        full_name: response.guest.full_name,
        phone_number: response.guest.phone_number,
        group_size: response.group_size || 1,
      },
    };
  } catch (error) {
    console.error('Unexpected error fetching guest information:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
};
