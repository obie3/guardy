import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { LogEntry } from '../../types/database';
import { Clock, Users, Timer, MapPin } from 'lucide-react-native';

// Dummy data
const dummyLogs: LogEntry[] = [
  {
    id: '1',
    residentName: 'John Smith',
    unit: 'Block A-123',
    visitDate: new Date(),
    numberOfGuests: 3,
    accessCode: 'ABC123',
    validityPeriod: '2 hours',
    status: 'verified',
    timestamp: Date.now(),
  },
  {
    id: '2',
    residentName: 'Sarah Johnson',
    unit: 'Block B-456',
    visitDate: new Date(Date.now() - 3600000), // 1 hour ago
    numberOfGuests: 2,
    accessCode: 'DEF456',
    validityPeriod: '4 hours',
    status: 'pending',
    timestamp: Date.now() - 3600000,
  },
  {
    id: '3',
    residentName: 'Michael Chang',
    unit: 'Block C-789',
    visitDate: new Date(Date.now() - 7200000), // 2 hours ago
    numberOfGuests: 5,
    accessCode: 'GHI789',
    validityPeriod: '24 hours',
    status: 'expired',
    timestamp: Date.now() - 7200000,
  },
];

const LogsScreen = () => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [logs] = useState<LogEntry[]>(dummyLogs);

  const getStatusColor = (status: LogEntry['status']) => {
    switch (status) {
      case 'verified':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      case 'expired':
        return theme.colors.error;
      default:
        return theme.colors.text.secondary;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };

  const renderLogItem = ({ item }: { item: LogEntry }) => (
    <TouchableOpacity
      style={[
        styles.logItem,
        { backgroundColor: theme.colors.background.secondary },
      ]}
    >
      <View style={styles.logHeader}>
        <View style={styles.residentInfo}>
          <Text style={[styles.residentName, { color: theme.colors.text.primary }]}>
            {item.residentName}
          </Text>
          <View style={styles.unitContainer}>
            <MapPin size={14} color={theme.colors.text.secondary} />
            <Text style={[styles.unitText, { color: theme.colors.text.secondary }]}>
              {item.unit}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + '20' },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(item.status) },
            ]}
          >
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.logDetails}>
        <View style={styles.detailItem}>
          <Clock size={16} color={theme.colors.text.secondary} />
          <Text style={[styles.detailText, { color: theme.colors.text.secondary }]}>
            {formatDate(item.visitDate)}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Users size={16} color={theme.colors.text.secondary} />
          <Text style={[styles.detailText, { color: theme.colors.text.secondary }]}>
            {item.numberOfGuests} {item.numberOfGuests === 1 ? 'guest' : 'guests'}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Timer size={16} color={theme.colors.text.secondary} />
          <Text style={[styles.detailText, { color: theme.colors.text.secondary }]}>
            {item.validityPeriod}
          </Text>
        </View>
      </View>

      <View style={[styles.codeContainer, { backgroundColor: theme.colors.background.tertiary }]}>
        <Text style={[styles.codeLabel, { color: theme.colors.text.tertiary }]}>
          Access Code:
        </Text>
        <Text style={[styles.codeText, { color: theme.colors.text.primary }]}>
          {item.accessCode}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // In a real app, fetch new logs here
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background.primary },
      ]}
    >
      {/* <FlatList
        data={logs}
        renderItem={renderLogItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
              No logs available
            </Text>
          </View>
        )}
      /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  logItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  residentInfo: {
    flex: 1,
    marginRight: 12,
  },
  residentName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 4,
  },
  unitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  logDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    marginLeft: 6,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  codeLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    marginRight: 8,
  },
  codeText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
});

export default LogsScreen;