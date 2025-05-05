import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSync } from '../../context/SyncContext';
import { useAuth } from '../../context/AuthContext';
import { QrCode, Keyboard, RefreshCw, Info, ArrowRight } from 'lucide-react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainTabParamList, RootStackParamList } from '../../types/navigation';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  StackNavigationProp<RootStackParamList>
>;

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const { theme, isDarkMode } = useTheme();
  const { uploadData, syncStatus } = useSync();
  const { authState } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

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
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Recent Activity
          </Text>
          <View style={styles.emptyStateContainer}>
            <Info size={24} color={theme.colors.text.secondary} />
            <Text style={[styles.emptyStateText, { color: theme.colors.text.secondary }]}>
              Your recent verifications will appear here
            </Text>
          </View>
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
              onPress={uploadData}
              disabled={syncStatus.isUploading}
            >
              <RefreshCw
                size={18}
                color={theme.colors.primary}
                style={syncStatus.isUploading ? styles.rotating : undefined}
              />
              <Text style={[styles.syncButtonText, { color: theme.colors.primary }]}>
                {syncStatus.isUploading ? 'Syncing...' : 'Sync'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.lastSyncText, { color: theme.colors.text.tertiary }]}>
            {syncStatus.lastUploadTime
              ? `Last synced: ${formatDate(syncStatus.lastUploadTime)}`
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
    marginBottom: 24,
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
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 12,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
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
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  syncButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    marginLeft: 8,
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
