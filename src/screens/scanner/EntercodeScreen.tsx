import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

// Define the navigation stack parameter list
type RootStackParamList = {
  ScannerScreen: undefined;
  EntercodeScreen: undefined;
  VerificationScreen: {
    access_code: string;
  };
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

  // Custom keypad handlers
  const handleKeyPress = (value: string): void => {
    if (token.length < 6) {
      const newToken = token + value;
      setToken(newToken);

      // Automatically verify when token length reaches 6
      if (newToken.length === 6) {
        handleVerifyToken();
      }
    }
  };

  const handleDelete = (): void => {
    setToken(token.slice(0, -1));
  };

  // Function to render individual key
  const renderKey = (value: string | React.ReactNode, onPress: () => void, isWide?: boolean) => (
    <TouchableOpacity 
      style={[styles.keypadKey, isWide && styles.keypadKeyWide]} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      {typeof value === 'string' ? (
        <Text style={styles.keypadKeyText}>{value}</Text>
      ) : (
        value
      )}
    </TouchableOpacity>
  );

  return (
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
          <View style={styles.tokenInputContainer}>
            <TextInput
              style={styles.tokenInput}
              value=""
              placeholder={token || "000000"}
              placeholderTextColor={token ? "#202733" : "#BBBBBB"}
              editable={false}
              maxLength={6}
            />
          </View>
        </View>

        {/* Custom Keypad */}
        <View style={styles.keypadContainer}>
          <View style={styles.keypadRow}>
            {renderKey('1', () => handleKeyPress('1'))}
            {renderKey('2', () => handleKeyPress('2'))}
            {renderKey('3', () => handleKeyPress('3'))}
          </View>
          <View style={styles.keypadRow}>
            {renderKey('4', () => handleKeyPress('4'))}
            {renderKey('5', () => handleKeyPress('5'))}
            {renderKey('6', () => handleKeyPress('6'))}
          </View>
          <View style={styles.keypadRow}>
            {renderKey('7', () => handleKeyPress('7'))}
            {renderKey('8', () => handleKeyPress('8'))}
            {renderKey('9', () => handleKeyPress('9'))}
          </View>
          <View style={styles.keypadRow}>
            {renderKey('0', () => handleKeyPress('0'))}
            {renderKey(
              <Ionicons name="backspace-outline" size={24} color="#202733" />,
              handleDelete,
              true
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  tokenInputContainer: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tokenInput: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 24,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    letterSpacing: 8,
    color: '#202733',
  },
  keypadContainer: {
    marginTop: 20,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  keypadKey: {
    width: '30%',
    paddingVertical: 16,
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadKeyWide: {
    width: '63%',
  },
  keypadKeyText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 24,
    color: '#202733',
  },
  verifyButton: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  verifyButtonActive: {
    backgroundColor: '#4CAF50',
    opacity: 1,
  },
  verifyButtonDisabled: {
    backgroundColor: '#4CAF50',
    opacity: 0.5,
  },
  verifyButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#FFFFFF',
  },
});
