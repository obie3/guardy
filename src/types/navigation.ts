import { NavigatorScreenParams } from '@react-navigation/native';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Main Tab Navigation
export type MainTabParamList = {
  Home: undefined;
  Scanner: undefined;
  Profile: undefined;
};

// Scanner Stack
export type ScannerStackParamList = {
  ScanQR: undefined;
  Verification: { 
    qrData: string;
    scanId: string;
  };
};

// Root Stack contains auth, main, and direct routes
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