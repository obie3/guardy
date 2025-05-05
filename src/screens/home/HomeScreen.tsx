import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSync } from '../../context/SyncContext';
import { useAuth } from '../../context/AuthContext';
import { QrCode, Keyboard, RefreshCw } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Button from '../../components/common/Button';

const HomeScreen = () => {
  const { theme } = useTheme();
  const { uploadData, syncStatus } = useSync();
  const { authState } = useAuth();
  const navigation = useNavigation();

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={[styles.welcomeTitle, { color: theme.colors.text.primary }]}>
          Welcome to Guardy
        </Text>
        <Text style={[styles.welcomeSubtitle, { color: theme.colors.text.secondary }]}>
          Scan QR codes or enter access codes to verify guests
        </Text>
      </View>

      {/* Device Info Card */}
      <View style={[styles.card, { backgroundColor: theme.colors.background.secondary }]}>
        <View style={styles.deviceInfo}>
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
            size={16}
            color={theme.colors.primary}
            style={syncStatus.isUploading ? styles.rotating : undefined}
          />
          <Text style={[styles.syncButtonText, { color: theme.colors.primary }]}>
            {syncStatus.isUploading ? 'Syncing...' : 'Sync Now'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.lastSyncText, { color: theme.colors.text.tertiary }]}>
          {syncStatus.lastUploadTime
            ? `Last synced: ${formatDate(syncStatus.lastUploadTime)}`
            : 'Not synced yet'}
        </Text>
      </View>

      {/* Verification Actions */}
      <View style={styles.actionsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Verify Guest Access
        </Text>
        <Text style={[styles.sectionDescription, { color: theme.colors.text.secondary }]}>
          Choose how you want to verify guest access codes
        </Text>

        <View style={styles.buttonsContainer}>
          <Button
            title="Scan QR Code"
            onPress={() => navigation.navigate('Scanner', { screen: 'ScanQR' })}
            icon={<QrCode size={24} color={theme.colors.text.inverse} />}
            style={styles.actionButton}
          />
          
          <Button
            title="Enter Access Code"
            onPress={() => navigation.navigate('Scanner', { screen: 'EntercodeScreen' })}
            variant="secondary"
            icon={<Keyboard size={24} color={theme.colors.primary} />}
            style={styles.actionButton}
          />
        </View>
      </View>

      {/* Help Section */}
      <View style={styles.helpSection}>
        <Text style={[styles.helpTitle, { color: theme.colors.text.primary }]}>
          Need Help?
        </Text>
        <Text style={[styles.helpText, { color: theme.colors.text.secondary }]}>
          If you're having trouble verifying access codes or need assistance, contact support through the settings tab.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  welcomeSection: {
    marginVertical: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    lineHeight: 24,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  deviceInfo: {
    marginBottom: 16,
  },
  deviceLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
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
    textAlign: 'center',
  },
  actionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    marginBottom: 16,
    lineHeight: 20,
  },
  buttonsContainer: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 12,
  },
  helpSection: {
    padding: 16,
    marginTop: 8,
  },
  helpTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    lineHeight: 20,
  },
});

export default HomeScreen;
