import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Button, // Import Button
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { DatabaseContext } from '../../context/DatabaseContext';
import { Verification, Resident, AuthDevice } from '../../types/database'; // Removed LogEntry from here
import { Clock, Users, Timer, MapPin, AlertCircle } from 'lucide-react-native';

// Define LogEntry type locally or import if defined elsewhere and suitable
export interface LogEntry {
  id: string;
  residentName: string;
  unit: string;
  visitDate: Date;
  numberOfGuests: number; // Keep for UI, even if defaulted
  accessCode: string;
  validityPeriod: string;
  status: 'pending' | 'verified' | 'expired';
  timestamp: number;
}

const LogsScreen = () => {
  const { theme } = useTheme();
  const dbContext = useContext(DatabaseContext);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  const getStatus = (verification: Verification): LogEntry['status'] => {
    const now = Date.now();
    const visitDate = verification.visit_date;
    // validity_period in DB is in seconds, convert to milliseconds for comparison
    const validityEnd = visitDate + (verification.validity_period * 1000);

    if (now > validityEnd) {
      return 'expired';
    }
    // Assuming all stored logs that are not expired are considered 'verified'
    // A 'pending' state could be for future-dated entries if that logic is added
    return 'verified';
  };
  
  const formatValidityPeriod = (seconds: number): string => {
    if (seconds < 60) return `${seconds} sec`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (minutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours}h ${minutes}m`;
  };

  const fetchLogs = useCallback(async () => {
    if (!dbContext || !dbContext.database) {
      setError("Database not available");
      setLoading(false);
      setRefreshing(false);
      return;
    }
    // Ensure dbContext is not undefined before accessing its properties
    if (!dbContext.getVerifications || !dbContext.getResidentById) {
        setError("Database functions not available");
        setLoading(false);
        setRefreshing(false);
        return;
    }

    setLoading(true);
    setError(null);
    try {
      // Ensure getVerifications and getResidentById are available on dbContext
      const verifications = await dbContext.getVerifications();
      const enrichedLogs: LogEntry[] = [];

      for (const verification of verifications) {
        let residentName = 'Unknown Resident';
        let unit = 'N/A';
        try {
            const resident = await dbContext.getResidentById(verification.resident_id);
            if (resident) {
                residentName = resident.full_name;
                unit = resident.assigned_units.split(',')[0]?.trim() || 'N/A';
            }
        } catch (e) {
            console.warn(`Failed to fetch resident ${verification.resident_id}:`, e);
        }
        
        enrichedLogs.push({
          id: verification.id,
          residentName,
          unit,
          visitDate: new Date(verification.visit_date),
          numberOfGuests: 1, // Defaulting to 1 as it's not in Verification model
          accessCode: verification.access_code,
          validityPeriod: formatValidityPeriod(verification.validity_period),
          status: getStatus(verification),
          timestamp: verification.created_at,
        });
      }
      setLogEntries(enrichedLogs);
    } catch (e) {
      console.error("Failed to fetch logs:", e);
      setError("Failed to load logs. Pull to refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dbContext]);

  useEffect(() => {
    if (dbContext) { // Ensure dbContext is available before fetching
        fetchLogs();
    }
  }, [fetchLogs, dbContext]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLogs();
  }, [fetchLogs]);

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
            { backgroundColor: getStatusColor(item.status) + '20' }, // Corrected: getStatusColor is defined
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(item.status) }, // Corrected
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(item.status) }, // Corrected
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
            {formatDate(item.visitDate)} {/* Corrected: formatDate is defined */}
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

  if (loading && !refreshing && logEntries.length === 0) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10, color: theme.colors.text.primary }}>Loading logs...</Text>
      </View>
    );
  }

  if (error && logEntries.length === 0) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background.primary }]}>
        <AlertCircle size={48} color={theme.colors.error} />
        <Text style={[styles.errorText, { color: theme.colors.text.primary, marginTop: 10 }]}>{error}</Text>
        <Button title="Retry" onPress={fetchLogs} color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background.primary },
      ]}
    >
      <FlatList
        data={logEntries}
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
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                No logs available
              </Text>
            </View>
          )
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    flexGrow: 1, // Ensures emptyContainer can center itself if list is empty
  },
  logItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  logDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16, // Increased gap for better spacing
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13, // Slightly smaller for detail text
    fontFamily: 'Poppins-Regular',
    marginLeft: 6,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8, // Added margin for separation
  },
  codeLabel: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    marginRight: 8,
  },
  codeText: {
    fontSize: 14, // Keep code text slightly larger
    fontFamily: 'Poppins-SemiBold', // Make code stand out
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default LogsScreen;