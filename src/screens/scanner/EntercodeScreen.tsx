import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { ScannerStackParamList } from '../../types/navigation';
import { useFocusEffect } from '@react-navigation/native';
import { useDatabase } from '../../context/DatabaseContext';

type EntercodeScreenNavigationProp = StackNavigationProp<ScannerStackParamList, 'EntercodeScreen'>;

type EnterAccessTokenProps = {
  navigation: EntercodeScreenNavigationProp;
};

export const EntercodeScreen: React.FC<EnterAccessTokenProps> = ({
  navigation,
}) => {
  // State for token input and loading state
  const [token, setToken] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const { getResidents } = useDatabase();
  
  // Preload residents data
  useEffect(() => {
    const preloadResidents = async () => {
      try {
        await getResidents();
      } catch (err) {
        console.error('Failed to preload residents:', err);
      }
    };
    preloadResidents();
  }, []);

  // Reset state when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setToken('');
      setIsVerifying(false);
    }, [])
  );

  const handleGoBack = (): void => {
    // Reset input and navigate to root scanner screen
    setToken('');
    setIsVerifying(false);
    navigation.navigate('ScanQR');
  };

  const handleVerifyToken = (): void => {
    // Show verifying indicator and ensure token is complete
    if (token.length !== 6) {
      return;
    }
    
    setIsVerifying(true);
    
    // Navigate to verification screen immediately with the complete token
    navigation.navigate('VerificationScreen', {
      access_code: token,
    });
  };

  // Custom keypad handlers
  const handleKeyPress = async (value: string): Promise<void> => {
    // Only allow input if we're not currently verifying and token is not complete
    if (!isVerifying && token.length < 6) {
      const newToken = token + value;
      
      if (newToken.length === 6) {
        // When we have 6 digits, validate basic format first
        const isValidFormat = /^\d{6}$/.test(newToken);
        if (!isValidFormat) {
          // Invalid format, just update token but don't verify
          setToken(newToken);
          return;
        }
        
        // Set verifying state and navigate
        setToken(newToken);
        setIsVerifying(true);
        navigation.navigate('VerificationScreen', {
          access_code: newToken,
        });
      } else {
        // Otherwise just update the token
        setToken(newToken);
      }
    }
  };

  const handleDelete = (): void => {
    // Only allow deletion if we're not currently verifying
    if (!isVerifying) {
      setToken(token.slice(0, -1));
    }
  };

  // Function to render individual digit boxes
  const renderDigitBoxes = () => {
    const digitBoxes = [];
    // Create 6 boxes (one for each digit)
    for (let i = 0; i < 6; i++) {
      const hasDigit = i < token.length;
      digitBoxes.push(
        <View 
          key={i} 
          style={[
            styles.digitBox, 
            hasDigit && styles.digitBoxFilled
          ]}
        >
          <Text style={hasDigit ? styles.digitText : styles.digitPlaceholder}>
            {hasDigit ? token[i] : '0'}
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.digitBoxContainer}>
        {digitBoxes}
      </View>
    );
  };

  // Function to render individual key
  const renderKey = (value: string | React.ReactNode, onPress: () => void, isWide?: boolean) => (
    <TouchableOpacity 
      style={[
        styles.keypadKey, 
        isWide && styles.keypadKeyWide
      ]} 
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

      <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
        <Ionicons name="arrow-back" size={24} color="#202733" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Enter Access Code</Text>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Enter 6-digit Token</Text>
          
          <TextInput
            style={styles.hiddenInput}
            value={token}
            editable={false}
            maxLength={6}
          />
          
          {renderDigitBoxes()}
          
          {isVerifying && (
            <View style={styles.verifyingContainer}>
              <ActivityIndicator size="small" color="#4CAF50" />
              <Text style={styles.verifyingText}>Verifying...</Text>
            </View>
          )}
        </View>

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
              <Ionicons name="backspace-outline" size={24} color="#666666" />,
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
    backgroundColor: '#FFFFFF',
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
    fontSize: 32,
    color: '#202733',
    marginBottom: 40,
  },
  inputSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  inputLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
  },
  digitBoxContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  digitBox: {
    width: 50,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  digitBoxFilled: {
    backgroundColor: '#FFFFFF',
    borderColor: '#4CAF50',
  },
  digitText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#202733',
  },
  digitPlaceholder: {
    fontFamily: 'Poppins-Regular',
    fontSize: 24,
    color: '#E0E0E0',
  },
  verifyingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  verifyingText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#4CAF50',
    marginLeft: 8,
  },
  keypadContainer: {
    marginTop: 20,
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  keypadKey: {
    width: 75,
    height: 75,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  keypadKeyWide: {
    width: 174,  // Width of two keys (75 * 2) plus one margin space (24)
  },
  keypadKeyText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#202733',
  },
});
