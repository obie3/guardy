import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import {
  useNavigation,
  CompositeNavigationProp,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  MainTabParamList,
  ScannerStackParamList,
} from '../../types/navigation';
import { BarCodeScannerResult } from 'expo-barcode-scanner';
import { useTheme } from '../../context/ThemeContext';
import { useDatabase } from '../../context/DatabaseContext';
import * as Haptics from 'expo-haptics';
import { CameraView, Camera } from 'expo-camera';

type ScannerScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<ScannerStackParamList, 'ScanQR'>,
  BottomTabNavigationProp<MainTabParamList>
>;

export const ScannerScreen = () => {
  const navigation = useNavigation<ScannerScreenNavigationProp>();
  const { theme } = useTheme();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    // Set up a cleanup function to prevent state updates after unmount
    return () => {
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: BarCodeScannerResult) => {
    if (scanned) return;

    setScanned(true);

    // Provide haptic feedback if not on web
    if (Platform.OS !== 'web') {
      try {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      } catch (error) {
        console.log('Haptics not available:', error);
      }
    }
    const parsedParams = JSON.parse(data);
    // Navigate to verification screen
    navigation.navigate('VerificationScreen', {
      access_code: parsedParams.code,
    });
  };

  if (hasPermission === null) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background.primary },
        ]}
      >
        <Text style={[styles.text, { color: theme.colors.text.primary }]}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background.primary },
        ]}
      >
        <Text style={[styles.text, { color: theme.colors.text.primary }]}>
          No access to camera
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text
            style={[styles.buttonText, { color: theme.colors.text.inverse }]}
          >
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Overlay elements */}
      <View style={styles.overlay}>
        <View style={styles.scanWindow} />

        <Text
          style={[styles.instructions, { color: theme.colors.text.inverse }]}
        >
          Position QR code within the frame to scan
        </Text>

        {
          <TouchableOpacity
            style={[
              styles.scanAgainButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => navigation.navigate('EntercodeScreen')}
          >
            {/* <Camera size={20} color={theme.colors.text.inverse} /> */}
            <Text
              style={[
                styles.scanAgainText,
                { color: theme.colors.text.inverse },
              ]}
            >
              Enter Access Code
            </Text>
          </TouchableOpacity>
        }
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanWindow: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 16,
    backgroundColor: 'transparent',
    marginBottom: 40,
  },
  instructions: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  scanAgainButton: {
    position: 'absolute',
    bottom: 80,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  scanAgainText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    marginLeft: 8,
  },
});
