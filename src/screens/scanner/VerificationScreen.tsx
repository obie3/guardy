import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  RouteProp,
  useRoute,
  CompositeNavigationProp,
} from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  MainTabParamList,
  ScannerStackParamList,
} from '../../types/navigation';
import { useDatabase } from '../../context/DatabaseContext';
import { useSync } from '../../context/SyncContext';
import { useAuth } from '../../context/AuthContext';
import { verifyTOTP } from '../../services/verification';
import { VerificationResult } from '../../types/verification';
import { fetchGuestInformation, GuestInfo } from '../../services/supabase';
import { GuestInfoCard } from '../../components/common/GuestInfoCard';

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
  let isMounted = useRef<boolean>(false);
  const route = useRoute<VerificationScreenRouteProp>();
  const { access_code = '' } = route.params;
  const { getResidents, saveVerification } = useDatabase();
  const { authState } = useAuth();
  const { backgroundSync } = useSync();

  const [verifying, setVerifying] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);
  const [loadingGuestInfo, setLoadingGuestInfo] = useState(false);
  const [guestInfoError, setGuestInfoError] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Verify the token
  useEffect(() => {
    isMounted.current = true;
    verifyToken();
    // Cleanup function
    return () => {
      isMounted.current = false;
    };
  }, [
    access_code,
    getResidents,
    saveVerification,
    authState.deviceInfo?.id,
    backgroundSync,
  ]);

  // Reset verification state if navigation is canceled
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      setVerifying(false);
      setResult(null);
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (result?.success) {
      loadGuestInfo();
    }

    return () => {
      isMounted.current = false;
    };
  }, [result, access_code]);

  // Verify the token
  const verifyToken = async () => {
    try {
      const residents = await getResidents();
      console.log(`Fetched ${residents.length} residents for verification`);

      // If unmounted, don't continue
      if (!isMounted.current) return;

      if (residents.length === 0) {
        setResult({
          success: false,
          message: 'No residents data available',
        });
        setVerifying(false);
        triggerErrorFeedback();
        Alert.alert(
          'No Residents Found',
          'Please sync the app to download resident data.'
        );
        return;
      }

      // Quick format validation first
      if (!/^\d{6}$/.test(access_code)) {
        setResult({
          success: false,
          message: 'Invalid token format.\nPlease enter exactly 6 digits.',
        });
        setVerifying(false);
        triggerErrorFeedback();
        return;
      }

      // Verify the token against all residents
      const verificationResult = await verifyTOTP(access_code, residents);
      // If unmounted, don't continue
      if (!isMounted.current) return;

      console.log('Verification result:', verificationResult);

      // If verification was successful, save the verification record
      if (
        verificationResult.success &&
        verificationResult.resident &&
        verificationResult.visit
      ) {
        try {
          await saveVerification({
            resident_id: verificationResult.resident.id,
            access_code: access_code,
            visit_date: verificationResult.visit.visitDate.getTime(),
            validity_period: verificationResult.visit.validityPeriod,
            created_at: Date.now(),
          });

          // Trigger background sync after successful verification
          if (authState.deviceInfo?.id) {
            backgroundSync(authState.deviceInfo.id).catch(console.error);
          }
        } catch (error) {
          console.error('Failed to save verification:', error);
          // Don't fail the verification if saving fails
        }
      }

      setResult(verificationResult);
      setVerifying(false);
    } catch (error) {
      // If unmounted, don't continue
      if (!isMounted.current) return;

      console.error('Error verifying token:', error);
      setResult({
        success: false,
        message: 'Error verifying token',
      });
      setVerifying(false);
    }
  };

  const loadGuestInfo = async () => {
    if (!result?.success || !result.resident?.id) return;

    setLoadingGuestInfo(true);
    setGuestInfoError(null);

    try {
      const response = await fetchGuestInformation(
        access_code,
        result.resident.id
      );
      if (!isMounted.current) return;

      if (response.success && response.data) {
        setGuestInfo(response.data);
      } else {
        setGuestInfoError(response.error || 'Failed to load guest information');
      }
    } catch (error) {
      if (!isMounted.current) return;
      setGuestInfoError('An unexpected error occurred');
    } finally {
      if (isMounted.current) setLoadingGuestInfo(false);
    }
  };

  const handleGoBack = (): void => {
    // Reset state and navigate back to input screen
    setVerifying(false);
    setResult(null);
    navigation.navigate('EntercodeScreen');
  };

  const handleViewGuestDetails = (): void => {
    // Navigate to guest details screen if implemented
    console.log('Viewing guest details');
  };

  const handleDone = (): void => {
    // Reset state and go back to scanner
    setVerifying(false);
    setResult(null);
    navigation.navigate('EntercodeScreen');
  };

  const resetVerification = () => {
    setResult(null);
    setVerifying(false);
    fadeAnim.setValue(0);
    navigation.navigate('EntercodeScreen');
  };

  // Format validity period for display
  const formatValidityPeriod = (seconds?: number): string => {
    if (!seconds) return 'N/A';

    if (seconds === 10) return '10 seconds (Demo)';
    if (seconds === 1800) return '30 minutes';
    if (seconds === 7200) return '2 hours';

    return `${seconds} seconds`;
  };

  // Format date for display
  const formatDate = (date?: Date): string => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Get unit information from resident's assigned units
  const getUnitInfo = (assignedUnits?: string): string => {
    if (!assignedUnits) return 'N/A';
    return assignedUnits.split(',')[0] || assignedUnits;
  };

  useEffect(() => {
    // Reset animation when verification starts
    if (verifying) {
      fadeAnim.setValue(0);
    }
    // Trigger animation when verification fails
    if (!verifying && result && !result.success) {
      triggerErrorFeedback();
    }
  }, [verifying, result]);

  const triggerErrorFeedback = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const renderVerificationResult = () => {
    if (verifying) {
      return (
        <View style={styles.verificationResult}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Verifying code...</Text>
        </View>
      );
    }

    if (!result) return null;

    if (!result.success) {
      return (
        <Animated.View
          style={[
            styles.verificationResult,
            styles.verificationError,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle" size={24} color="#FF3B30" />
          </View>
          <Text style={styles.errorTitle}>Invalid Token</Text>
          <Text style={styles.errorText}>
            The token you scanned is not valid. Please try scanning again.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              resetVerification();
              Haptics.selectionAsync();
            }}
          >
            <Text style={styles.retryButtonText}>Try New Code</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    }

    return (
      <View style={[styles.verificationResult, styles.verificationSuccess]}>
        <View style={styles.validIndicator}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.validText}>Valid Token</Text>
        </View>

        <View style={styles.contentCard}>
          <View style={styles.visitorInfo}>
            <View style={styles.infoRow}>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Resident</Text>
                <Text style={styles.infoValue}>
                  {result.resident?.full_name || 'N/A'}
                </Text>
              </View>

              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Unit</Text>
                <Text style={styles.infoValue}>
                  {getUnitInfo(result.resident?.assigned_units)}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.timeInfo}>
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Visit Date:</Text>
                <Text style={styles.timeValue}>
                  {formatDate(result.visit?.visitDate)}
                </Text>
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Validity Period:</Text>
                <Text style={styles.timeValue}>
                  {formatValidityPeriod(result.visit?.validityPeriod)}
                </Text>
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Guest ID:</Text>
                <Text style={styles.timeValue}>
                  {result.visit?.guest.id || 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Guest Information Section */}
        {result.success &&
          (guestInfo ? (
            <GuestInfoCard
              guestInfo={guestInfo}
              isLoading={loadingGuestInfo}
              error={guestInfoError || undefined}
            />
          ) : loadingGuestInfo ? (
            <GuestInfoCard
              guestInfo={{
                full_name: '',
                phone_number: '',
                group_size: 0,
              }}
              isLoading={true}
            />
          ) : null)}

        <View style={styles.buttonContainer}>
          {/* Conditionally render the View Guest Details button */}
          {!(guestInfo && !loadingGuestInfo && !guestInfoError) && (
            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={handleViewGuestDetails}
            >
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#4169E1"
                style={styles.buttonIcon}
              />
              <Text style={styles.viewDetailsText}>View Guest Details</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
          {verifying ? (
            <View style={styles.verificationResult}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Verifying token...</Text>
            </View>
          ) : (
            renderVerificationResult()
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24, // Add padding at bottom for better scrolling experience
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
    paddingHorizontal: 32, // Increased horizontal padding
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%', // Use width instead of minWidth
    marginHorizontal: 0, // Remove any horizontal margin
  },
  tokenText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 32, // Increased font size
    color: '#202733',
    letterSpacing: 12, // Increased letter spacing
    textAlign: 'center',
    width: '100%', // Ensure text takes full width
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#4A4A4A',
    marginTop: 16,
    textAlign: 'center',
  },
  verificationResult: {
    borderRadius: 8,
    padding: 20,
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  verificationError: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFE5E5',
    minHeight: 200,
  },
  errorText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  visitorInfo: {
    width: '100%',
  },
  verificationSuccess: {
    backgroundColor: '#4CAF50',
    borderWidth: 0,
    padding: 24,
  },
  validIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  successIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  validText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#FFFFFF',
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoColumn: {
    flex: 1,
    marginRight: 16,
  },
  infoLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  infoValue: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#202733',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
    width: '100%',
  },
  timeInfo: {
    width: '100%',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    width: '100%',
  },
  timeLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  timeValue: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#202733',
    flex: 1,
    textAlign: 'right',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 8,
  },
  viewDetailsButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  viewDetailsText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#4169E1',
  },
  doneButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#4CAF50',
  },
  errorIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorMessageContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  errorHelpText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
  tryAgainButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  tryAgainText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  errorTitle: {
    color: '#FF3B30',
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  // scrollContent: {
  //   paddingBottom: 40,
  // },
});
