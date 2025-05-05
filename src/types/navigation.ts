import { NavigatorScreenParams } from '@react-navigation/native';

// Auth Stack
export type AuthStackParamList = {
  DeviceRegistration: undefined;
};

// Scanner Stack (moved to Main Tab navigation)
export type ScannerStackParamList = {
  ScanQR: undefined;
  EntercodeScreen: undefined;
  VerificationScreen: {
    access_code?: string;
  };
};

// Main Tab Navigation
export type MainTabParamList = {
  Home: undefined;
  Scanner: NavigatorScreenParams<ScannerStackParamList>;
  Logs: undefined;
  Settings: undefined;
};

// Root Stack contains auth and main routes
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Loading: undefined;
};

// Create a type for navigation prop
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
