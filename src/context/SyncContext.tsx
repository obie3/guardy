import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { useDatabase } from './DatabaseContext';
import { supabaseRest } from '../services/supabaseRest';
import { Resident, AuthDevice } from '../types/database';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants for sync configuration
const SYNC_INTERVAL = 1000 * 60 * 15; // 15 minutes
const SYNC_RETRY_DELAY = 1000 * 60 * 5; // 5 minutes
const LAST_SYNC_KEY = 'last_sync_time';

// Define context value type
type SyncContextValue = {
  syncStatus: {
    lastSyncTime: number | null;
    isSyncing: boolean;
    syncError: string | null;
    syncProgress: number;
    totalItems: number;
    currentItem: number;
  };
  syncResidents: (estateId: string) => Promise<void>;
  backgroundSync: (deviceId: string) => Promise<void>;
  forceSyncNow: (deviceId: string) => Promise<void>;
};

// Create the context
const SyncContext = createContext<SyncContextValue | undefined>(undefined);

// Provider component
export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const { saveResident, startSync, updateSync } = useDatabase();
  const [syncStatus, setSyncStatus] = useState({
    lastSyncTime: null as number | null,
    syncProgress: 0,
    totalItems: 0,
    currentItem: 0,
    isSyncing: false,
    syncError: null as string | null,
  });

  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const lastDeviceIdRef = useRef<string>();
  const networkRetryTimeoutRef = useRef<NodeJS.Timeout>();

  // Load last sync time on mount
  useEffect(() => {
    const loadLastSyncTime = async () => {
      try {
        const lastSyncTime = await AsyncStorage.getItem(LAST_SYNC_KEY);
        if (lastSyncTime) {
          setSyncStatus(prev => ({
            ...prev,
            lastSyncTime: parseInt(lastSyncTime, 10)
          }));
        }
      } catch (error) {
        console.error('Error loading last sync time:', error);
      }
    };
    loadLastSyncTime();
  }, []);

  // Save last sync time whenever it changes
  useEffect(() => {
    if (syncStatus.lastSyncTime) {
      AsyncStorage.setItem(LAST_SYNC_KEY, syncStatus.lastSyncTime.toString())
        .catch(error => console.error('Error saving last sync time:', error));
    }
  }, [syncStatus.lastSyncTime]);

  // Cleanup function for sync timeouts
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      if (networkRetryTimeoutRef.current) {
        clearTimeout(networkRetryTimeoutRef.current);
      }
    };
  }, []);

  // Sync residents function
  const syncResidents = async (estateId: string) => {
    if (syncStatus.isSyncing) {
      return;
    }

    // Check if enough time has passed since last sync
    const now = Date.now();
    if (syncStatus.lastSyncTime && (now - syncStatus.lastSyncTime) < SYNC_INTERVAL) {
      console.log('Skipping sync - too soon since last sync');
      return;
    }

    setSyncStatus((prev) => ({
      ...prev,
      isSyncing: true,
      syncError: null,
      syncProgress: 0,
      currentItem: 0,
      totalItems: 0,
    }));

    // Start sync operation in history
    let syncId: string;
    try {
      syncId = await startSync(estateId, 'residents');
    } catch (error) {
      console.error('Failed to start sync:', error);
      return;
    }

    try {
      // Check network connectivity before proceeding
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        throw new Error('No network connectivity');
      }

      // Fetch residents from Supabase using RPC call
      const response = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/rpc/get_estate_residents`,
        {
          method: 'POST',
          headers: {
            'apikey': process.env.SUPABASE_ANON_KEY || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ device_id: estateId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch residents');
      }

      const residents = await response.json();

      if (!residents) {
        throw new Error('No residents data received');
      }

      setSyncStatus((prev) => ({
        ...prev,
        totalItems: residents.length,
      }));

      // Process each resident
      for (let i = 0; i < residents.length; i++) {
        const resident = residents[i];
        try {
          await saveResident({
            id: resident.id,
            full_name: resident.full_name,
            phone_number: resident.phone_number,
            secret: resident.secret,
            assigned_units: resident.assigned_units,
            synced: true,
            last_sync: now,
          });

          setSyncStatus((prev) => ({
            ...prev,
            currentItem: i + 1,
            syncProgress: ((i + 1) / residents.length) * 100,
          }));
        } catch (err) {
          console.error('Error saving resident:', err);
          throw err;
        }
      }

      // Update sync status on completion
      await updateSync(syncId, { status: 'success', itemsSynced: residents.length });
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: now,
        syncError: null,
      }));

      // Schedule next sync
      scheduleSyncTimeout(estateId);
    } catch (error) {
      console.error('Sync error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (syncId) {
        await updateSync(syncId, { status: 'failed', errorMessage });
      }
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        syncError: errorMessage,
      }));

      // Schedule retry with shorter interval on error
      scheduleRetry(estateId);
    }
  };

  // Schedule next sync
  const scheduleSyncTimeout = (deviceId: string) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(() => {
      backgroundSync(deviceId);
    }, SYNC_INTERVAL);
  };

  // Schedule retry on error
  const scheduleRetry = (deviceId: string) => {
    if (networkRetryTimeoutRef.current) {
      clearTimeout(networkRetryTimeoutRef.current);
    }
    networkRetryTimeoutRef.current = setTimeout(() => {
      backgroundSync(deviceId);
    }, SYNC_RETRY_DELAY);
  };

  // Background sync function with network monitoring
  const backgroundSync = async (deviceId: string) => {
    try {
      lastDeviceIdRef.current = deviceId;
      await syncResidents(deviceId);
    } catch (error) {
      console.error('Background sync failed:', error);
      scheduleRetry(deviceId);
    }
  };

  // Force immediate sync
  const forceSyncNow = async (deviceId: string) => {
    try {
      // Clear any pending sync timeouts
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      if (networkRetryTimeoutRef.current) {
        clearTimeout(networkRetryTimeoutRef.current);
      }

      // Reset last sync time to force immediate sync
      setSyncStatus(prev => ({
        ...prev,
        lastSyncTime: null
      }));

      // Perform sync
      await syncResidents(deviceId);
    } catch (error) {
      console.error('Force sync failed:', error);
    }
  };

  // Network connectivity monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && lastDeviceIdRef.current && !syncStatus.isSyncing) {
        // Don't sync immediately on connection, add a small delay
        setTimeout(() => {
          backgroundSync(lastDeviceIdRef.current!);
        }, 5000);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [syncStatus.isSyncing]);

  // Context value
  const value: SyncContextValue = {
    syncStatus,
    syncResidents,
    backgroundSync,
    forceSyncNow,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

// Hook to use the sync context
export const useSync = () => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
