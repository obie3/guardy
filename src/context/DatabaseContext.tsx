import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import * as SQLite from 'expo-sqlite';
import { Resident, Scan } from '../types/database';

type DatabaseContextValue = {
  database: SQLite.SQLiteDatabase | null;
  saveScan: (access_code: string) => Promise<Scan>;
  getScans: () => Promise<Scan[]>;
  getResidents: () => Promise<Resident[]>;
  deleteSyncedRecord: (id: string) => Promise<void>;
  saveResident: (param: Resident) => Promise<void>;
  loading: boolean;
  error: string | null;
};

// Create the context
const DatabaseContext = createContext<DatabaseContextValue | undefined>(
  undefined
);

// Provider component
export const DatabaseProvider = ({ children }: { children: ReactNode }) => {
  const [database, setDatabase] = useState<SQLite.SQLiteDatabase | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize database
  useEffect(() => {
    const initDatabase = async () => {
      try {
        setLoading(true);
        // Open the database
        const db = await SQLite.openDatabaseAsync('scanner.db');
        
        // Handle schema migrations
        await db.withTransactionAsync(async () => {
          // Create version table if it doesn't exist
          await db.execAsync(
            `CREATE TABLE IF NOT EXISTS db_version (
              version INTEGER PRIMARY KEY
            )`
          );
          
          // Get current version
          const result = await db.getFirstAsync<{ version: number }>(
            'SELECT version FROM db_version ORDER BY version DESC LIMIT 1'
          );
          const currentVersion = result?.version || 0;
          
          if (currentVersion < 1) {
            // Drop old tables
            await db.execAsync('DROP TABLE IF EXISTS residents');
            
            // Create new schema
            await db.execAsync(
              `CREATE TABLE residents (
                id TEXT PRIMARY KEY,
                full_name TEXT NOT NULL,
                phone_number TEXT NOT NULL,
                secret TEXT NOT NULL,
                assigned_units TEXT NOT NULL,
                synced INTEGER NOT NULL DEFAULT 0,
                last_sync INTEGER
              )`
            );
            
            // Update version
            await db.execAsync('INSERT INTO db_version (version) VALUES (1)');
          }
        });
        
        setDatabase(db);

        // Create tables if they don't exist
        db.withTransactionAsync(async () => {
          await db.execAsync(
            `CREATE TABLE IF NOT EXISTS scans (
              id TEXT PRIMARY KEY,
              access_code TEXT NOT NULL,
              timestamp INTEGER NOT NULL,
              synced INTEGER NOT NULL DEFAULT 0
            )`
          );

          await db.execAsync(
            `CREATE TABLE IF NOT EXISTS residents (
              id TEXT PRIMARY KEY,
              full_name TEXT NOT NULL,
              phone_number TEXT NOT NULL,
              secret TEXT NOT NULL,
              assigned_units TEXT NOT NULL,
              synced INTEGER NOT NULL DEFAULT 0,
              last_sync INTEGER
            )`
          );
          saveScan('12345566');
        });
      } catch (e) {
        console.error('Error initializing database:', e);
        setError('Failed to initialize database');
        setLoading(false);
      }
    };

    initDatabase();
  }, []);

  const generateUniqueId = () => {
    return 'id_' + Date.now();
  };

  // Save a new scan to the database
  const saveScan = async (access_code: string): Promise<Scan> => {
    if (database === null) {
      throw new Error('Database not initialized');
    }
    const scanId = generateUniqueId();
    const timestamp = Date.now();
    const newScan: Scan = {
      id: generateUniqueId(),
      access_code: access_code,
      timestamp,
      synced: false,
    };
    const result = await database.runAsync(
      'INSERT INTO scans (id, access_code, timestamp, synced) VALUES (?, ?, ?, ?)',
      [Number(scanId), access_code, timestamp, 0]
    );

    return newScan;
  };

  const saveResident = async (param: Resident): Promise<void> => {
    if (database === null) {
      throw new Error('Database not initialized');
    }

    // Check if resident already exists
    const existing = await database.getFirstAsync<Resident>(
      'SELECT * FROM residents WHERE id = ?',
      [param.id]
    );

    if (existing) {
      // Update existing resident
      await database.runAsync(
        `UPDATE residents 
         SET full_name = ?, 
             phone_number = ?, 
             secret = ?, 
             assigned_units = ?, 
             synced = ?, 
             last_sync = ?
         WHERE id = ?`,
        [
          param.full_name,
          param.phone_number,
          param.secret,
          param.assigned_units,
          param.synced ? 1 : 0,
          param.last_sync,
          param.id
        ]
      );
    } else {
      // Insert new resident
      await database.runAsync(
        'INSERT INTO residents (id, full_name, phone_number, secret, assigned_units, synced, last_sync) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          param.id,
          param.full_name,
          param.phone_number,
          param.secret,
          param.assigned_units,
          param.synced ? 1 : 0,
          param.last_sync
        ]
      );
    }
  };

  // Get all scans from the database
  const getScans = async (): Promise<Scan[]> => {
    if (database === null) {
      throw new Error('Database not initialized');
    }

    const result: Scan[] = await database.getAllAsync(
      'SELECT * FROM scans ORDER BY timestamp DESC'
    );

    const scans: Scan[] = [];
    for (let i = 0; i < result.length; i++) {
      const item = result[i];
      scans.push({
        id: item.id,
        access_code: item.access_code,
        timestamp: item.timestamp,
        synced: true,
      });

      // console.log(row.id, row.value, row.intValue);
    }
    return scans;
  };

  // Get all residents from the database
  const getResidents = async (): Promise<Resident[]> => {
    if (database === null) {
      throw new Error('Database not initialized');
    }

    const result: Resident[] = await database.getAllAsync(
      'SELECT * FROM residents'
    );

    const residents: Resident[] = [];
    for (let i = 0; i < result.length; i++) {
      const item = result[i];
      residents.push({
        id: item.id,
        full_name: item.full_name,
        phone_number: item.phone_number,
        secret: item.secret,
        assigned_units: item.assigned_units,
        synced: Boolean(item.synced),
        last_sync: item.last_sync,
      });
    }
    return residents;
  };

  const deleteSyncedRecord = async (id: string): Promise<void> => {
    if (database === null) {
      throw new Error('Database not initialized');
    }
    const result = await database.runAsync(
      'DELETE FROM test WHERE id = $value',
      { $value: id }
    );
  };

  // Context value
  const value: DatabaseContextValue = {
    database,
    saveScan,
    getScans,
    getResidents,
    saveResident,
    deleteSyncedRecord,
    // addScans,
    loading,
    error,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

// Hook to use the database context
export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
