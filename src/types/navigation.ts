import { NavigatorScreenParams } from '@react-navigation/native';

// Auth Stack
export type AuthStackParamList = {
  DeviceRegistration: undefined;
};

// Main Tab Navigation
export type MainTabParamList = {
  Home: undefined;
  Logs: undefined;
  Settings: undefined;
};

// Scanner Stack (moved to Home navigation)
export type ScannerStackParamList = {
  ScanQR: undefined;
  VerificationScreen: {
    access_code?: string;
  };
  EntercodeScreen: undefined;
};

// Root Stack contains auth and main routes
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Scanner: NavigatorScreenParams<ScannerStackParamList>;
  Loading: undefined;
};

// Create a type for navigation prop
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
