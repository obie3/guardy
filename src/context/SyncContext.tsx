import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useDatabase } from './DatabaseContext';
import { supabase } from '../services/supabase';
import { Resident, Scan } from '../types/database';
// import * as BackgroundFetch from 'expo-background-fetch';

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
};

// Create the context
const SyncContext = createContext<SyncContextValue | undefined>(undefined);

// Provider component
export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const { authState } = useAuth();
  const { getScans, deleteSyncedRecord, saveResident } = useDatabase();
  const [syncStatus, setSyncStatus] = useState({
    lastSyncTime: null as number | null,
    syncProgress: 0,
    totalItems: 0,
    currentItem: 0,
    isSyncing: false,
    syncError: null as string | null,
  });

  // Sync residents function
  const syncResidents = async (estateId: string) => {
    if (syncStatus.isSyncing) {
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

    try {
      // Fetch residents from Supabase using the complex query
      console.log('Fetching residents from Supabase for estateId:', estateId);  

      const { data: residents, error } = await supabase
        .rpc('get_estate_residents', {
          device_id: estateId
        });

      console.log('Residents fetched:', residents);

      if (error) throw error;

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
            full_name: resident.full_name,
            phone_number: resident.phone_number,
            secret: resident.secret,
            assigned_units: resident.assigned_units,
            synced: true,
            last_sync: Date.now(),
          });

          setSyncStatus((prev) => ({
            ...prev,
            currentItem: i + 1,
            syncProgress: ((i + 1) / residents.length) * 100,
          }));
        } catch (err) {
          console.error(`Error saving resident ${resident.id}:`, err);
        }
      }

      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: Date.now(),
        syncProgress: 100,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync residents';
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        syncError: errorMessage,
      }));
      throw error;
    }
  };

  // Context value
  const value: SyncContextValue = {
    syncStatus,
    syncResidents,
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
