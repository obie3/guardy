import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSync } from '../../context/SyncContext';
import { User, LogOut, Moon, RefreshCw, ChevronRight, Bell, Shield, CircleHelp as HelpCircle } from 'lucide-react-native';

const ProfileScreen = () => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { authState, logout } = useAuth();
  const { syncNow, syncStatus } = useSync();

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.profileHeader}>
        <View style={[styles.avatarContainer, { backgroundColor: theme.colors.primary + '20' }]}>
          <User size={32} color={theme.colors.primary} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: theme.colors.text.primary }]}>
            {authState.user?.user_metadata?.user_id || 'User'}
          </Text>
          <Text style={[styles.profileEmail, { color: theme.colors.text.secondary }]}>
            {authState.user?.email || 'No email provided'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          App Settings
        </Text>
        
        <View style={[styles.card, { backgroundColor: theme.colors.background.secondary }]}>
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={syncNow}
            disabled={syncStatus.isSyncing}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                <RefreshCw size={20} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                  Sync Data
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.text.tertiary }]}>
                  {syncStatus.isSyncing
                    ? 'Syncing...'
                    : syncStatus.lastSyncTime
                    ? `Last sync: ${new Date(syncStatus.lastSyncTime).toLocaleTimeString()}`
                    : 'Sync your local data with the cloud'}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.accent + '20' }]}>
                <Moon size={20} color={theme.colors.accent} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                  Dark Mode
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.text.tertiary }]}>
                  {isDarkMode ? 'On' : 'Off'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#3e3e3e', true: theme.colors.primary + '80' }}
              thumbColor={isDarkMode ? theme.colors.primary : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.warning + '20' }]}>
                <Bell size={20} color={theme.colors.warning} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                  Notifications
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.text.tertiary }]}>
                  Manage notification settings
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Support & Info
        </Text>
        
        <View style={[styles.card, { backgroundColor: theme.colors.background.secondary }]}>
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.secondary + '20' }]}>
                <HelpCircle size={20} color={theme.colors.secondary} />
              </View>
              <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                Help & Support
              </Text>
            </View>
            <ChevronRight size={20} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.success + '20' }]}>
                <Shield size={20} color={theme.colors.success} />
              </View>
              <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                Privacy Policy
              </Text>
            </View>
            <ChevronRight size={20} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: theme.colors.error + '10' }]}
        onPress={handleLogout}
      >
        <LogOut size={20} color={theme.colors.error} />
        <Text style={[styles.logoutText, { color: theme.colors.error }]}>
          Log Out
        </Text>
      </TouchableOpacity>

      <View style={styles.versionContainer}>
        <Text style={[styles.versionText, { color: theme.colors.text.tertiary }]}>
          Version 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 12,
    paddingLeft: 4,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  settingDescription: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  versionText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
});

export default ProfileScreen;