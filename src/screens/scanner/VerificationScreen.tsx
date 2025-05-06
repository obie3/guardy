import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useRoute, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList, ScannerStackParamList } from '../../types/navigation';

type VerificationScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<ScannerStackParamList, 'VerificationScreen'>,
  BottomTabNavigationProp<MainTabParamList>
>;

type VerificationScreenRouteProp = RouteProp<
  ScannerStackParamList,
  'VerificationScreen'
>;

type VerificationScreenProps = {
  navigation: VerificationScreenNavigationProp;
};

export const VerificationScreen: React.FC<VerificationScreenProps> = ({
  navigation,
}) => {
  const route = useRoute<VerificationScreenRouteProp>();
  const { access_code } = route.params;

  const handleGoBack = (): void => {
    navigation.goBack();
  };

  const handleViewGuestDetails = (): void => {
    // Navigate to guest details screen if implemented
    console.log('Viewing guest details');
  };

  const handleDone = (): void => {
    // Navigate back to Home tab
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Verify Access Token</Text>

        {/* Token Display Section */}
        <View style={styles.tokenDisplay}>
          <Text style={styles.tokenDisplayTitle}>6-digit Token</Text>
          <View style={styles.tokenBox}>
            <Text style={styles.tokenText}>{access_code}</Text>
          </View>
        </View>

        {/* Verification Result Section */}
        <View style={styles.verificationResult}>
          <View style={styles.validIndicator}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.validText}>Valid Token</Text>
          </View>

          <Text style={styles.verifiedText}>Token verified successfully</Text>

          <View style={styles.divider} />

          <View style={styles.visitorInfo}>
            <View style={styles.infoRow}>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Resident</Text>
                <Text style={styles.infoValue}>Chidinma Okafor</Text>
              </View>

              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Unit</Text>
                <Text style={styles.infoValue}>House 23B</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.timeInfo}>
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Visit Date:</Text>
                <Text style={styles.timeValue}>01/05/2025</Text>
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Validity Period:</Text>
                <Text style={styles.timeValue}>30 minutes</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={handleViewGuestDetails}
          >
            <Text style={styles.viewDetailsText}>View Guest Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleDone}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
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
    marginBottom: 30,
  },
  tokenDisplay: {
    marginBottom: 20,
  },
  tokenDisplayTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#4A4A4A',
    marginBottom: 12,
  },
  tokenBox: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 30,
    color: '#202733',
  },
  verificationResult: {
    backgroundColor: '#F2FFF4',
    borderRadius: 8,
    padding: 20,
    marginTop: 20,
  },
  validIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  validText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#4A4A4A',
    marginLeft: 8,
  },
  verifiedText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#4CAF50',
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  visitorInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoColumn: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#4A4A4A',
    marginBottom: 4,
  },
  infoValue: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#202733',
  },
  infoExtra: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#4A4A4A',
    marginTop: 4,
  },
  timeInfo: {
    marginVertical: 8,
  },
  timeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timeLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#4A4A4A',
    marginRight: 8,
  },
  timeValue: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#202733',
  },
  viewDetailsButton: {
    backgroundColor: '#4169E1',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  viewDetailsText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
  doneButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
