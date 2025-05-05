import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { AuthStackParamList } from '../../types/navigation';
import * as yup from 'yup';
import { Smartphone, Check } from 'lucide-react-native';
import Button from '../../components/common/Button';

type DeviceRegistrationScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'DeviceRegistration'>;

// Validation schema
const deviceRegistrationSchema = yup.object().shape({
  deviceCode: yup
    .string()
    .required('Device code is required')
    .matches(/^[A-Z0-9]{6,12}$/, 'Device code must be 6-12 uppercase letters and numbers')
});

const DeviceRegistrationScreen = () => {
  const navigation = useNavigation<DeviceRegistrationScreenNavigationProp>();
  const { registerDevice, continueToMainApp, authState } = useAuth();
  const { theme } = useTheme();

  const [deviceCode, setDeviceCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ deviceCode?: string }>({});
  
  // Separate state to track actual registration success
  const wasRegistrationSuccessful = useRef(false);

  // Check if device is already registered when component mounts
  useEffect(() => {
    if (authState.deviceRegistered) {
      wasRegistrationSuccessful.current = true;
    }
  }, []); // Empty dependency array - only run once on mount
  
  // Handle updates to authState after registration
  useEffect(() => {
    // Only update if we've already registered successfully
    if (wasRegistrationSuccessful.current && authState.deviceRegistered) {
      console.log('Device registration confirmed by authState');
    }
    // We don't add any code that could hide the success view
  }, [authState.deviceRegistered]);

  // Validate form
  const validateForm = async () => {
    try {
      await deviceRegistrationSchema.validate({ deviceCode }, { abortEarly: false });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const newErrors: { deviceCode?: string } = {};
        error.inner.forEach((err) => {
          if (err.path) {
            newErrors[err.path as 'deviceCode'] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  // Handle device registration
  const handleRegisterDevice = async () => {
    // Validate the input first
    const isValid = await validateForm();
    if (!isValid) {
      return;
    }
    
    try {
      setLoading(true);
      console.log('Attempting to register with device code:', deviceCode);
      
      // Call the registerDevice function with the user input
      const result = await registerDevice(deviceCode);
      console.log('Registration result:', result);
      
      if (!result.success) {
        console.log('Registration failed with error:', result.error);
        Alert.alert(
          'Registration Failed',
          result.error || 'Invalid device code. Please check the code and try again.',
          [{ text: 'OK' }]
        );
      } else {
        console.log('Registration successful!');
        // Set the success view immediately and PERMANENTLY
        wasRegistrationSuccessful.current = true; 
      }
    } catch (error) {
      console.error('Unexpected error during registration:', error);
      Alert.alert(
        'Error', 
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      console.log('Registration process completed, loading state reset');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {authState.deviceRegistered && authState.showSuccessScreen ? (
          // Success state view
          <View style={styles.successContainer}>
            <View style={[styles.successIconContainer, { backgroundColor: theme.colors.success + '20' }]}>
              <Check size={40} color={theme.colors.success} />
            </View>
            
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              Device Registered!
            </Text>
            
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
              Your device has been successfully registered and is now authorized to use the app.
            </Text>
            
            {authState.deviceInfo && (
              <View style={[styles.deviceInfoCard, { 
                backgroundColor: theme.colors.background.secondary,
                borderColor: theme.colors.border
              }]}>
                <Text style={[styles.deviceInfoTitle, { color: theme.colors.text.primary }]}>
                  Device Information
                </Text>
                
                <View style={styles.deviceInfoRow}>
                  <Text style={[styles.deviceInfoLabel, { color: theme.colors.text.secondary }]}>
                    Device Code:
                  </Text>
                  <Text style={[styles.deviceInfoValue, { color: theme.colors.text.primary }]}>
                    {authState.deviceCode}
                  </Text>
                </View>
                
                {authState.deviceInfo.name && (
                  <View style={styles.deviceInfoRow}>
                    <Text style={[styles.deviceInfoLabel, { color: theme.colors.text.secondary }]}>
                      Device Name:
                    </Text>
                    <Text style={[styles.deviceInfoValue, { color: theme.colors.text.primary }]}>
                      {authState.deviceInfo.name}
                    </Text>
                  </View>
                )}
                
                {authState.deviceInfo.status && (
                  <View style={styles.deviceInfoRow}>
                    <Text style={[styles.deviceInfoLabel, { color: theme.colors.text.secondary }]}>
                      Location:
                    </Text>
                    <Text style={[styles.deviceInfoValue, { color: theme.colors.text.primary }]}>
                      {authState.deviceInfo.status}
                    </Text>
                  </View>
                )}
                
                <View style={styles.deviceInfoRow}>
                  <Text style={[styles.deviceInfoLabel, { color: theme.colors.text.secondary }]}>
                    Status:
                  </Text>
                  <Text style={[styles.deviceInfoValue, { color: theme.colors.text.primary }]}>
                    {authState.deviceInfo.status ? 'active' : 'inactive'}
                  </Text>
                </View>
              </View>
            )}
            
            <Button
              title="Continue to App"
              onPress={() => {
                console.log('Continue to app button pressed');
                // Use the continueToMainApp method from AuthContext
                // This will set showSuccessScreen to false and trigger navigation to main app
                continueToMainApp();
              }}
              style={{ marginTop: theme.spacing.l }}
            />
          </View>
        ) : (
          // Registration form
          <>
            <View style={styles.iconContainer}>
              <View style={[styles.iconBackground, { backgroundColor: theme.colors.primary + '20' }]}>
                <Smartphone size={40} color={theme.colors.primary} />
              </View>
            </View>

            <View style={styles.headerContainer}>
              <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                Register Device
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
                Enter your device code to register this device. You can find the device code in your admin portal or contact support.
              </Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                  Device Code
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.background.secondary,
                      color: theme.colors.text.primary,
                      borderColor: errors.deviceCode ? theme.colors.error : theme.colors.border,
                    },
                  ]}
                  placeholder="Enter device code"
                  placeholderTextColor={theme.colors.text.tertiary}
                  value={deviceCode}
                  onChangeText={(text) => {
                    setDeviceCode(text);
                    if (errors.deviceCode) {
                      setErrors((prev) => ({ ...prev, deviceCode: undefined }));
                    }
                  }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                {errors.deviceCode && (
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    {errors.deviceCode}
                  </Text>
                )}
              </View>

              <Button
                title="Register Device"
                onPress={handleRegisterDevice}
                loading={loading}
                icon={<Smartphone size={20} color={theme.colors.text.inverse} />}
                style={{ marginTop: theme.spacing.l }}
              />

              <Text style={[styles.helpText, { color: theme.colors.text.tertiary }]}>
                This is a one-time registration process. Once registered, this device will be authorized to scan and verify access codes.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    lineHeight: 24,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginTop: 4,
  },
  helpText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 20,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  deviceInfoCard: {
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    marginTop: 24,
  },
  deviceInfoTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    marginBottom: 8,
  },
  deviceInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  deviceInfoLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  deviceInfoValue: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
});

export default DeviceRegistrationScreen;