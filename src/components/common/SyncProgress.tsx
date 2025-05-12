import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useSync } from '../../context/SyncContext';
import { useTheme } from '../../context/ThemeContext';

export const SyncProgress = () => {
  const { syncStatus } = useSync();
  const { colors } = useTheme();

  if (!syncStatus.isDownloading) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} />
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          Syncing Residents Data...
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {syncStatus.currentItem} of {syncStatus.totalItems} residents
        </Text>
      </View>
      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressBar, 
            { 
              backgroundColor: colors.primary,
              width: `${syncStatus.syncProgress}%` 
            }
          ]} 
        />
      </View>
      {syncStatus.downloadError && (
        <Text style={[styles.error, { color: colors.error }]}>
          {syncStatus.downloadError}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'column',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  spinner: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  error: {
    marginTop: 8,
    fontSize: 14,
  }
});
