import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define auth state type
type AuthState = {
  authenticated: boolean;
  user: User | null;
  loading: boolean;
};

// Define context value type
type AuthContextValue = {
  authState: AuthState;
  login: (userId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (email: string, password: string, userId: string) => Promise<{ success: boolean; error?: string }>;
};

// Create the context
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Create a storage mechanism that works on both web and native
const storage = Platform.OS === 'web' 
  ? AsyncStorage 
  : {
      getItem: (key: string) => SecureStore.getItemAsync(key),
      setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
      removeItem: (key: string) => SecureStore.deleteItemAsync(key),
    };

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    authenticated: false,
    user: null,
    loading: true,
  });

  // Initialize auth state on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check session
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error.message);
          setAuthState({ authenticated: false, user: null, loading: false });
          return;
        }

        if (data?.session) {
          setAuthState({
            authenticated: true,
            user: data.session.user,
            loading: false,
          });
        } else {
          setAuthState({ authenticated: false, user: null, loading: false });
        }
      } catch (error) {
        console.error('Unexpected error during auth initialization:', error);
        setAuthState({ authenticated: false, user: null, loading: false });
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setAuthState({
            authenticated: true,
            user: session.user,
            loading: false,
          });
        } else if (event === 'SIGNED_OUT') {
          setAuthState({ authenticated: false, user: null, loading: false });
        }
      }
    );

    return () => {
      // Clean up the listener when the component unmounts
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Login function
  const login = async (userId: string, password: string) => {
    try {
      // In a real app, you would use email auth, but for this example we're using userId
      // You would typically look up the email from the userId first
      const email = `${userId}@example.com`; // This is just for demonstration
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error during login:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error during logout:', error.message);
      }
    } catch (error) {
      console.error('Unexpected error during logout:', error);
    }
  };

  // Register function
  const register = async (email: string, password: string, userId: string) => {
    try {
      // In a real app, you'd validate the uniqueness of userId first
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_id: userId,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // For this example, we're auto-confirming
      return { success: true };
    } catch (error) {
      console.error('Unexpected error during registration:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const value: AuthContextValue = {
    authState,
    login,
    logout,
    register,
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