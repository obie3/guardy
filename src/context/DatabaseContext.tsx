import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import * as SQLite from 'expo-sqlite';
import { Resident, Scan } from '../types/database';
import { v4 as uuidv4 } from 'uuid';

// Define the database context value type
type DatabaseContextValue = {
  database: SQLite.SQLiteDatabase | null;
  saveScan: (access_code: string) => Promise<Scan>;
  getScans: () => Promise<Scan[]>;
  deleteSyncedRecord: (id: number) => Promise<void>;
  saveResident: (param: Resident) => Promise<void>;
  // addScans: (access_code: Scan[]) => Promise<Scan[]>;
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
        setDatabase(db);
        // Create tables if they don't exist
        db.withTransactionAsync(async () => {
          db.execAsync(
            `CREATE TABLE IF NOT EXISTS scans (
              id TEXT PRIMARY KEY,
              access_code TEXT NOT NULL,
              timestamp INTEGER NOT NULL,
              synced INTEGER NOT NULL DEFAULT 0
            )`
          );
        });
      } catch (e) {
        console.error('Error initializing database:', e);
        setError('Failed to initialize database');
        setLoading(false);
      }
    };

    initDatabase();
  }, []);

  // Save a new scan to the database
  const saveScan = async (access_code: string): Promise<Scan> => {
    if (!database) {
      // reject(new Error('Database not initialized'));
      throw new Error('Database not initialized');
    }
    const scanId = uuidv4();
    const timestamp = Date.now();
    const newScan: Scan = {
      id: scanId,
      accessCode: access_code,
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
    if (!database) {
      // reject(new Error('Database not initialized'));
      throw new Error('Database not initialized');
    }
    const scanId = uuidv4();

    const result = await database.runAsync(
      'INSERT INTO residents (id, first_name, last_name, house_number) VALUES (?, ?, ?, ?)',
      [Number(scanId), param.first_name, param.last_name, param.house_number]
    );
  };

  // Get all scans from the database
  const getScans = async (): Promise<Scan[]> => {
    if (!database) {
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
        accessCode: item.accessCode,
        timestamp: item.timestamp,
        synced: true,
      });
      // console.log(row.id, row.value, row.intValue);
    }
    return scans;
  };

  const deleteSyncedRecord = async (id: number): Promise<void> => {
    if (!database) {
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
