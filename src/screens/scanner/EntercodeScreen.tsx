import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

// Define the navigation stack parameter list
type RootStackParamList = {
  ScannerScreen: undefined;
  EntercodeScreen: undefined;
  VerificationScreen: undefined;
};

// Define props type for the component
type EnterAccessTokenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'EntercodeScreen'>;
};

export const EntercodeScreen: React.FC<EnterAccessTokenProps> = ({
  navigation,
}) => {
  // State for token input
  const [token, setToken] = useState<string>('');

  const handleGoBack = (): void => {
    navigation.goBack();
  };

  const handleVerifyToken = (): void => {
    // Implement token verification logic here
    console.log('Verifying token:', token);
    // You could navigate to a success screen or show verification result
    navigation.navigate('VerificationScreen', {
      access_code: token,
      // scanId: scan.id,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <View style={styles.content}>
            <Text style={styles.title}>Verify Access Token</Text>

            {/* Token Input Section */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Enter 6-digit Token</Text>
              <TextInput
                style={styles.tokenInput}
                value={token}
                onChangeText={setToken}
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                autoCorrect={false}
              />
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleVerifyToken}
              activeOpacity={0.8}
            >
              <Text style={styles.verifyButtonText}>Verify Token</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  safeArea: {
    flex: 1,
  },
  backButton: {
    padding: 16,
    position: 'absolute',
    top: 45,
    left: 10,
    zIndex: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: '#202733',
    marginBottom: 40,
  },
  inputSection: {
    marginBottom: 32,
  },
  inputLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#4A4A4A',
    marginBottom: 12,
  },
  tokenInput: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 24,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    letterSpacing: 2,
  },
  verifyButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  verifyButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#FFFFFF',
  },
});
