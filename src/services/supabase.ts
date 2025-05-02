import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration
const supabaseUrl = 'https://xmgfrxudhlcxmhkbbmns.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtZ2ZyeHVkaGxjeG1oa2JibW5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTMxMzIsImV4cCI6MjA2MDQ2OTEzMn0.eqM3-M03WfEcwOMxl0g2Hs9GBefoay25U9C37ZiiuXM';

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
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createCustomStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Create initial database tables
export const setupSupabase = async () => {
  // This function should be called once to set up the initial database structure
  // For example, when the app is first installed or during a database migration

  // Create scans table if it doesn't exist
  const { error } = await supabase.rpc('create_scans_table');

  if (error && !error.message.includes('already exists')) {
    console.error('Error creating tables:', error);
  }
};

// Helper function to check if Supabase connection is working
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('scans')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error testing Supabase connection:', error);
    return false;
  }
};
