import React, { useEffect, useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { useTheme } from '../../context/ThemeContext';
import { useSync } from '../../context/SyncContext';
import { useAuth } from '../../context/AuthContext';
import { QrCode, Keyboard, RefreshCw, Info, ArrowRight, Clock } from 'lucide-react-native';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  StatusBar, 
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { SyncProgress } from '../../components/common/SyncProgress';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainTabParamList, RootStackParamList } from '../../types/navigation';
import { Verification } from '../../types/database';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  StackNavigationProp<RootStackParamList>
>;

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const { theme, isDarkMode } = useTheme();
  const { syncResidents, syncStatus } = useSync();
  const { authState } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { getVerifications, getResidents } = useDatabase();
  const [recentVerifications, setRecentVerifications] = useState<(Verification & { 
    residentName?: string;
    unit?: string;
  })[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    try {
      // You should get the estate_id from authState or device info
      await syncResidents(authState.deviceInfo?.id || '');
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  // Format date with relative time if recent, otherwise full date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      return date.toLocaleString();
    }
  };

  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const formatDuration = (duration: number): string => {
    if (duration === 10) return '10s';
    if (duration === 1800) return '30m';
    return '2h';
  };

  // For debugging sync status
  React.useEffect(() => {
    console.log('Sync status:', { lastSyncTime: syncStatus.lastSyncTime });
  }, [syncStatus.lastSyncTime]);

  // Get first unit from comma-separated list
  const getFirstUnit = (units?: string): string => {
    if (!units) return '';
    return units.split(',')[0].trim();
  };

  useEffect(() => {
    const fetchRecentVerifications = async () => {
      setLoading(true);
      try {
        const [verifications, residents] = await Promise.all([
          getVerifications(),
          getResidents()
        ]);
        
        console.log('Fetched verifications:', verifications.length);
        console.log('Fetched residents:', residents.length);
        
        const recentOnes = verifications
          .sort((a, b) => b.visit_date - a.visit_date)
          .slice(0, 5)
          .map(verification => {
            const resident = residents.find(r => r.id === verification.resident_id);
            return {
              ...verification,
              residentName: resident?.full_name,
              unit: getFirstUnit(resident?.assigned_units)
            };
          });
        
        console.log('Processed recent verifications:', recentOnes.length);
        setRecentVerifications(recentOnes);
      } catch (error) {
        console.error('Error fetching verifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentVerifications();
  }, [getVerifications, getResidents]);

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
    >
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Text style={[styles.welcomeTitle, { color: theme.colors.text.primary }]}>
              Guardy
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: theme.colors.text.secondary }]}>
              Guest Verification Terminal
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.syncButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSync}
            disabled={syncStatus.isSyncing}
          >
            <RefreshCw 
              size={20} 
              color={theme.colors.text.inverse} 
              style={[
                styles.syncIcon,
                syncStatus.isSyncing && styles.rotating
              ]} 
            />
            <Text style={[styles.syncButtonText, { color: theme.colors.text.inverse }]}>
              {syncStatus.isSyncing ? 'Syncing...' : 'Sync Data'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Verification Actions */}
        <View style={[styles.mainActionCard, { backgroundColor: theme.colors.background.secondary }]}>
          <Text style={[styles.mainActionTitle, { color: theme.colors.text.primary }]}>
            Verify Guest Access
          </Text>
          
          <View style={styles.mainButtonsContainer}>
            <TouchableOpacity 
              style={[styles.mainActionButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.jumpTo('Scanner', { screen: 'ScanQR' })}
            >
              <View style={styles.mainActionIconContainer}>
                <QrCode size={36} color={theme.colors.text.inverse} />
              </View>
              <Text style={[styles.mainActionButtonText, { color: theme.colors.text.inverse }]}>
                Scan QR Code
              </Text>
              <ArrowRight size={20} color={theme.colors.text.inverse} style={styles.mainActionArrow} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.mainActionButton, { backgroundColor: theme.colors.background.tertiary }]}
              onPress={() => navigation.jumpTo('Scanner', { screen: 'EntercodeScreen' })}
            >
              <View style={styles.mainActionIconContainer}>
                <Keyboard size={36} color={theme.colors.primary} />
              </View>
              <Text style={[styles.mainActionButtonText, { color: theme.colors.text.primary }]}>
                Enter Access Code
              </Text>
              <ArrowRight size={20} color={theme.colors.primary} style={styles.mainActionArrow} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity Section */}
        <View style={[styles.sectionContainer, { backgroundColor: theme.colors.background.secondary }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Recent Activity
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.text.tertiary }]}>
                Last 5 verifications
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.viewAllButton, { backgroundColor: theme.colors.background.tertiary }]}
              onPress={() => navigation.navigate('Logs')}
            >
              <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>View All</Text>
              <ArrowRight size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
                Loading recent verifications...
              </Text>
            </View>
          ) : recentVerifications.length > 0 ? (
            <View style={styles.verificationsList}>
              {recentVerifications.map((verification, index) => (
                <TouchableOpacity 
                  key={verification.id} 
                  style={[
                    styles.verificationItem,
                    { 
                      backgroundColor: theme.colors.background.primary,
                      borderBottomColor: theme.colors.border,
                      borderBottomWidth: index === recentVerifications.length - 1 ? 0 : 1
                    }
                  ]}
                  onPress={() => console.log('Verification details:', verification)}
                >
                  <View style={styles.verificationInfo}>
                    <View style={styles.verificationMain}>
                      <View style={styles.verificationNameContainer}>
                        <Text style={[styles.verificationName, { color: theme.colors.text.primary }]}>
                          {verification.residentName || 'Unknown Resident'}
                        </Text>
                        {verification.unit ? (
                          <View style={[styles.unitTag, { backgroundColor: theme.colors.background.tertiary }]}>
                            <Text style={[styles.unitText, { color: theme.colors.text.secondary }]}>
                              Unit {verification.unit}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={[styles.verificationTime, { color: theme.colors.text.secondary }]}>
                        {formatRelativeTime(verification.visit_date)}
                      </Text>
                    </View>
                    <View style={styles.verificationDetails}>
                      <View style={[styles.durationTag, { backgroundColor: theme.colors.background.tertiary }]}>
                        <Clock size={12} color={theme.colors.primary} style={{ marginRight: 4 }} />
                        <Text style={[styles.durationText, { color: theme.colors.primary }]}>
                          {formatDuration(verification.validity_period)}
                        </Text>
                      </View>
                      <View style={styles.codeContainer}>
                        <Text style={[styles.codeLabel, { color: theme.colors.text.tertiary }]}>
                          Code:
                        </Text>
                        <Text style={[styles.codeValue, { color: theme.colors.text.primary }]}>
                          {verification.access_code}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyStateContainer, { backgroundColor: theme.colors.background.primary }]}>
              <View style={[styles.emptyStateIcon, { backgroundColor: theme.colors.background.tertiary }]}>
                <Info size={24} color={theme.colors.primary} />
              </View>
              <Text style={[styles.emptyStateTitle, { color: theme.colors.text.primary }]}>
                No Recent Activity
              </Text>
              <Text style={[styles.emptyStateText, { color: theme.colors.text.secondary }]}>
                Your recent verifications will appear here
              </Text>
            </View>
          )}
        </View>

        {/* Device Info Section */}
        <View style={[styles.sectionContainer, { backgroundColor: theme.colors.background.secondary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Device Information
          </Text>
          
          <View style={styles.deviceInfoRow}>
            <View>
              <Text style={[styles.deviceLabel, { color: theme.colors.text.secondary }]}>
                Device ID
              </Text>
              <Text style={[styles.deviceId, { color: theme.colors.text.primary }]}>
                {authState.deviceCode || 'Not registered'}
              </Text>
            </View>
            
            <TouchableOpacity
                style={[styles.syncButton, { backgroundColor: theme.colors.background.tertiary }]}
                onPress={handleSync}
                disabled={syncStatus.isSyncing}
              >
              <RefreshCw
                size={18}
                color={theme.colors.primary}
                style={syncStatus.isSyncing ? styles.rotating : undefined}
              />
              <Text style={[styles.syncButtonText, { color: theme.colors.primary }]}>
                {syncStatus.isSyncing ? 'Syncing...' : 'Sync'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.lastSyncText, { color: theme.colors.text.tertiary }]}>
            {syncStatus.lastSyncTime
              ? `Last synced: ${formatDate(syncStatus.lastSyncTime)}`
              : 'Not synced yet'}
          </Text>
        </View>

        {/* Help Section */}
        <TouchableOpacity 
          style={[styles.helpSection, { backgroundColor: theme.colors.background.secondary }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <View style={styles.helpContent}>
            <Info size={20} color={theme.colors.primary} />
            <View style={styles.helpTextContainer}>
              <Text style={[styles.helpTitle, { color: theme.colors.text.primary }]}>
                Need Help?
              </Text>
              <Text style={[styles.helpText, { color: theme.colors.text.secondary }]}>
                Contact support through settings
              </Text>
            </View>
          </View>
          <ArrowRight size={20} color={theme.colors.text.tertiary} />
        </TouchableOpacity>
      </ScrollView>

      <SyncProgress />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    padding: 16,
    marginBottom: 16,
  },
  welcomeSection: {
    marginVertical: 12,
  },
  welcomeTitle: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  mainActionCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mainActionTitle: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  mainButtonsContainer: {
    gap: 16,
  },
  mainActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  mainActionIconContainer: {
    marginRight: 16,
  },
  mainActionButtonText: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    flex: 1,
  },
  mainActionArrow: {
    marginLeft: 8,
  },
  sectionContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  verificationsList: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  verificationItem: {
    padding: 16,
  },
  verificationInfo: {
    flex: 1,
  },
  verificationMain: {
    marginBottom: 8,
  },
  verificationNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  verificationName: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  verificationTime: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    marginTop: 2,
  },
  unitTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unitText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
  verificationDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  durationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  durationText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeLabel: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
  },
  codeValue: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.5,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    borderRadius: 12,
  },
  emptyStateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
  deviceInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  syncButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  syncIcon: {
    marginRight: 8,
  },
  rotating: {
    transform: [{ rotate: '45deg' }],
  },
  lastSyncText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
  helpSection: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helpContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpTextContainer: {
    marginLeft: 12,
  },
  helpTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 2,
  },
  helpText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
});

export default HomeScreen;
