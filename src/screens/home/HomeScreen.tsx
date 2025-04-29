import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useDatabase } from '../../context/DatabaseContext';
import { useSync } from '../../context/SyncContext';
import { Scan } from '../../types/database';
import { QrCode, RefreshCw, Clock, ExternalLink } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
  const { theme } = useTheme();
  const { getScans } = useDatabase();
  const { syncNow, syncStatus } = useSync();
  const navigation = useNavigation();

  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load scans on mount
  useEffect(() => {
    loadScans();
  }, []);

  // Load scans from database
  const loadScans = async () => {
    try {
      setLoading(true);
      const data = await getScans();
      setScans(data);
    } catch (error) {
      console.error('Error loading scans:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadScans(), syncNow()]);
    } finally {
      setRefreshing(false);
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Render scan item
  const renderScanItem = ({ item }: { item: Scan }) => (
    <TouchableOpacity
      style={[
        styles.scanItem,
        { backgroundColor: theme.colors.background.secondary },
      ]}
      onPress={() => {
        navigation.navigate('Verification', {
          qrData: item.qrData,
          scanId: item.id,
        });
      }}
    >
      <View style={styles.scanItemContent}>
        <View style={[styles.scanIcon, { backgroundColor: theme.colors.primary + '20' }]}>
          <QrCode size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.scanInfo}>
          <Text style={[styles.scanData, { color: theme.colors.text.primary }]}>
            {item.qrData.length > 30 ? item.qrData.substring(0, 30) + '...' : item.qrData}
          </Text>
          <View style={styles.scanMeta}>
            <Clock size={12} color={theme.colors.text.tertiary} />
            <Text style={[styles.scanTime, { color: theme.colors.text.tertiary }]}>
              {formatDate(item.timestamp)}
            </Text>
          </View>
        </View>
      </View>
      <View style={[styles.syncStatus, item.synced ? styles.synced : styles.unsynced]}>
        <View 
          style={[
            styles.syncDot, 
            { backgroundColor: item.synced ? theme.colors.success : theme.colors.warning }
          ]} 
        />
        <Text 
          style={[
            styles.syncText,
            { color: item.synced ? theme.colors.success : theme.colors.warning }
          ]}
        >
          {item.synced ? 'Synced' : 'Local'}
        </Text>
      </View>
      <ExternalLink size={18} color={theme.colors.text.tertiary} />
    </TouchableOpacity>
  );

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.colors.background.secondary }]}>
        <QrCode size={40} color={theme.colors.text.tertiary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
        No Scans Yet
      </Text>
      <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
        Tap the Scanner tab to scan a QR code
      </Text>
      <TouchableOpacity
        style={[styles.scanButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('Scanner')}
      >
        <QrCode size={20} color={theme.colors.text.inverse} />
        <Text style={[styles.scanButtonText, { color: theme.colors.text.inverse }]}>
          Scan QR Code
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>Recent Scans</Text>
        <TouchableOpacity
          style={[
            styles.syncButton,
            { backgroundColor: theme.colors.background.secondary },
          ]}
          onPress={syncNow}
          disabled={syncStatus.isSyncing}
        >
          <RefreshCw
            size={16}
            color={theme.colors.primary}
            style={syncStatus.isSyncing ? styles.rotating : undefined}
          />
          <Text style={[styles.syncButtonText, { color: theme.colors.primary }]}>
            {syncStatus.isSyncing ? 'Syncing...' : 'Sync'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={scans}
        renderItem={renderScanItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  syncButtonText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    marginLeft: 4,
  },
  rotating: {
    transform: [{ rotate: '45deg' }],
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  scanItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  scanItemContent: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  scanIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scanInfo: {
    flex: 1,
  },
  scanData: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    marginBottom: 4,
  },
  scanMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanTime: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginLeft: 4,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  synced: {},
  unsynced: {},
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  syncText: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  scanButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    marginLeft: 8,
  },
});

export default HomeScreen;