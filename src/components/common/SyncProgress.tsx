import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useSync } from '../../context/SyncContext';
import { useTheme } from '../../context/ThemeContext';

export const SyncProgress = () => {
  const { syncStatus } = useSync();
  const { theme } = useTheme();

  if (!syncStatus.isSyncing) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <View style={styles.progressRow}>
        <View style={styles.leftContent}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]} numberOfLines={1}>
            {syncStatus.currentItem === syncStatus.totalItems ? 'Sync Complete' : 'Syncing...'}
          </Text>
          {syncStatus.totalItems > 0 && (
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]} numberOfLines={1}>
              {syncStatus.currentItem} of {syncStatus.totalItems}
            </Text>
          )}
        </View>
        <ActivityIndicator 
          size="small" 
          color={theme.colors.primary} 
          style={syncStatus.currentItem === syncStatus.totalItems ? styles.hidden : undefined} 
        />
      </View>
      
      <View style={[styles.progressContainer, { backgroundColor: theme.colors.background.secondary }]}>
        <View 
          style={[
            styles.progressBar, 
            { 
              backgroundColor: theme.colors.primary,
              width: `${syncStatus.syncProgress}%` 
            }
          ]} 
        />
      </View>
      
      {syncStatus.syncError && (
        <Text style={[styles.error, { color: theme.colors.error }]}>
          {syncStatus.syncError}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    padding: 10,
    borderRadius: 6,
    flexDirection: 'column',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  leftContent: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  progressContainer: {
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 1,
  },
  error: {
    marginTop: 8,
    fontSize: 12,
  },
  hidden: {
    opacity: 0,
  }
});
