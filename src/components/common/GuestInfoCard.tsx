import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GuestInfo } from '../../services/supabase';
import { useTheme } from '../../context/ThemeContext';
import { Users, AlertCircle, Phone, User } from 'lucide-react-native';

interface GuestInfoCardProps {
  guestInfo: GuestInfo;
  isLoading?: boolean;
  error?: string;
}

export const GuestInfoCard: React.FC<GuestInfoCardProps> = ({
  guestInfo,
  isLoading,
  error
}) => {
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.card, { backgroundColor: theme.colors.background.secondary }]}>
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background.tertiary }]}>
          <View style={[styles.loadingIconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
            <User size={24} color={theme.colors.primary} />
          </View>
          <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
            Loading guest information...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.card, { backgroundColor: theme.colors.background.secondary }]}>
        <View style={[styles.errorContainer, { backgroundColor: theme.colors.error + '10' }]}>
          <AlertCircle size={24} color={theme.colors.error} style={styles.errorIcon} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.background.secondary }]}>
      <View style={styles.header}>
        <View style={[styles.headerIconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
          <User size={24} color={theme.colors.primary} />
        </View>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>Guest Information</Text>
      </View>
      
      <View style={[styles.infoContainer, { backgroundColor: theme.colors.background.primary }]}>
        {/* Guest Name */}
        <View style={styles.infoRow}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.background.tertiary }]}>
            <User size={16} color={theme.colors.text.secondary} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Full Name</Text>
            <Text style={[styles.value, { color: theme.colors.text.primary }]}>
              {guestInfo.full_name}
            </Text>
          </View>
        </View>
        
        {/* Phone Number */}
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.infoRow}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.background.tertiary }]}>
            <Phone size={16} color={theme.colors.text.secondary} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Phone Number</Text>
            <Text style={[styles.value, { color: theme.colors.text.primary }]}>
              {guestInfo.phone_number}
            </Text>
          </View>
        </View>
        
        {/* Group Size */}
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.infoRow}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.background.tertiary }]}>
            <Users size={16} color={theme.colors.text.secondary} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Group Size</Text>
            <Text style={[styles.value, { color: theme.colors.text.primary }]}>
              {guestInfo.group_size} {guestInfo.group_size === 1 ? 'person' : 'people'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
  },
  infoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  divider: {
    height: 1,
  },
  loadingContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  errorIcon: {
    marginRight: 12,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    flex: 1,
  },
});
