import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ScannerStackParamList } from '../../types/navigation';
import { useTheme } from '../../context/ThemeContext';
// import { useDatabase } from '../../context/DatabaseContext';
import { useSync } from '../../context/SyncContext';
import { Check, Copy, Save } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { Platform } from 'react-native';
import Button from '../../components/common/Button';

type VerificationScreenRouteProp = RouteProp<
  ScannerStackParamList,
  'Verification'
>;

const VerificationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<VerificationScreenRouteProp>();
  const { theme } = useTheme();
  const { uploadData, syncStatus } = useSync();

  const { qrData } = route.params;

  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);

  useEffect(() => {
    // Start animations
    opacity.value = withDelay(300, withSpring(1));
    scale.value = withDelay(300, withSpring(1));

    // Check animation
    const animateCheck = () => {
      checkScale.value = withSequence(withSpring(1.2), withSpring(1));
      checkOpacity.value = withSpring(1);
    };

    // Delay check animation
    setTimeout(() => {
      animateCheck();

      // Haptic feedback on success
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        ).catch(console.error);
      }
    }, 600);

    // Try to sync
    uploadData().catch(console.error);
  }, []);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  const checkIconStyle = useAnimatedStyle(() => {
    return {
      opacity: checkOpacity.value,
      transform: [{ scale: checkScale.value }],
    };
  });

  // Copy QR data to clipboard
  const copyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(qrData);
      Alert.alert('Success', 'QR data copied to clipboard');

      // Haptic feedback
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
          console.error
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background.primary },
      ]}
    >
      <Animated.View
        style={[
          styles.card,
          containerStyle,
          { backgroundColor: theme.colors.background.secondary },
        ]}
      >
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.colors.success + '20' },
          ]}
        >
          <Animated.View style={checkIconStyle}>
            <Check size={40} color={theme.colors.success} />
          </Animated.View>
        </View>

        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          Scan Successful!
        </Text>

        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
          QR code data has been saved
        </Text>

        <View
          style={[
            styles.dataContainer,
            { backgroundColor: theme.colors.background.tertiary },
          ]}
        >
          <Text style={[styles.dataText, { color: theme.colors.text.primary }]}>
            {qrData.length > 50 ? qrData.substring(0, 50) + '...' : qrData}
          </Text>

          <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
            <Copy size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.syncStatus}>
          <Text
            style={[styles.syncText, { color: theme.colors.text.tertiary }]}
          >
            {syncStatus.isUploading
              ? 'Syncing data...'
              : syncStatus.lastUploadTime
              ? `Last synced: ${new Date(
                  syncStatus.lastUploadTime
                ).toLocaleTimeString()}`
              : 'Not synced yet'}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Scan Another"
            onPress={() => navigation.goBack()}
            variant="secondary"
            icon={<Save size={20} color={theme.colors.primary} />}
            style={{ flex: 1, marginRight: 8 }}
          />

          <Button
            title="Done"
            onPress={() => navigation.navigate('Home')}
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    marginBottom: 24,
    textAlign: 'center',
  },
  dataContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  dataText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  copyButton: {
    padding: 8,
  },
  syncStatus: {
    marginBottom: 24,
  },
  syncText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
  },
});

export default VerificationScreen;
