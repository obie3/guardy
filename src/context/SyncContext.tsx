import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useDatabase } from './DatabaseContext';
import { supabase } from '../services/supabase';
import { Resident, Scan } from '../types/database';
// import * as BackgroundFetch from 'expo-background-fetch';

// Define context value type
type SyncContextValue = {
  syncStatus: {
    lastUploadTime: number | null;
    lastDownloadTime: number | null;
    isUploading: boolean;
    isDownloading: boolean;
    uploadError: string | null;
    downloadError: string | null;
  };
  uploadData: () => Promise<void>;
  downloadResidentData: () => Promise<void>;
};

// Create the context
const SyncContext = createContext<SyncContextValue | undefined>(undefined);

// Provider component
export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const { authState } = useAuth();
  const { getScans, deleteSyncedRecord, saveResident } = useDatabase();
  const [syncStatus, setSyncStatus] = useState({
    lastUploadTime: null as number | null,
    lastDownloadTime: null as number | null,
    isUploading: false,
    isDownloading: false,
    uploadError: null as string | null,
    downloadError: null as string | null,
  });

  // Upload function (previously syncNow)
  const uploadData = async () => {
    if (!authState.authenticated || syncStatus.isUploading) {
      return;
    }

    try {
      setSyncStatus((prev) => ({
        ...prev,
        isUploading: true,
        uploadError: null,
      }));

      // Get unsynced scans
      const unsynced = await getScans();

      if (unsynced.length === 0) {
        setSyncStatus((prev) => ({
          ...prev,
          isUploading: false,
          lastUploadTime: Date.now(),
        }));
        return;
      }

      // Upload each scan
      for (const scan of unsynced) {
        const { error } = await supabase.from('scans').insert({
          id: scan.id,
          user_id: authState.user?.id,
          accessCode: scan.accessCode,
          timestamp: new Date(scan.timestamp).toISOString(),
        });

        if (!error) {
          // Mark as synced in local database
          await deleteSyncedRecord(Number(scan.id));
        } else {
          console.error('Error uploading scan:', error);
        }
      }

      setSyncStatus((prev) => ({
        ...prev,
        isUploading: false,
        lastUploadTime: Date.now(),
        uploadError: null,
      }));
    } catch (error) {
      console.error('Upload error:', error);
      setSyncStatus((prev) => ({
        ...prev,
        isUploading: false,
        uploadError: 'Failed to upload data',
      }));
    }
  };

  // Download function (new)
  const downloadResidentData = async () => {
    if (!authState.authenticated || syncStatus.isDownloading) {
      return;
    }

    try {
      setSyncStatus((prev) => ({
        ...prev,
        isDownloading: true,
        downloadError: null,
      }));

      // Fetch scans from Supabase
      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', authState.user?.id);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        // Transform to local scan format
        data.map(async (item) => {
          let resident: Resident = {
            first_name: item.firstname,
            last_name: item.lastname,
            street_name: item.streetName,
            house_number: item.houseNumber,
          };
          await saveResident(resident);
        });
      }

      setSyncStatus((prev) => ({
        ...prev,
        isDownloading: false,
        lastDownloadTime: Date.now(),
        downloadError: null,
      }));
    } catch (error) {
      console.error('Download error:', error);
      setSyncStatus((prev) => ({
        ...prev,
        isDownloading: false,
        downloadError: 'Failed to download data',
      }));
    }
  };

  // Context value
  const value: SyncContextValue = {
    syncStatus,
    uploadData,
    downloadResidentData,
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
