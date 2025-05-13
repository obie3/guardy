import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import * as SQLite from 'expo-sqlite';
import { Resident, Verification, SaveVerificationFunction, GetVerificationsFunction } from '../types/database';

type DatabaseContextValue = {
  database: SQLite.SQLiteDatabase | null;
  saveVerification: SaveVerificationFunction;
  getVerifications: GetVerificationsFunction;
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

          // Migration to version 2: Add verifications table and drop scans
          if (currentVersion < 2) {
            // Drop scans table
            await db.execAsync('DROP TABLE IF EXISTS scans');

            // Create verifications table
            await db.execAsync(
              `CREATE TABLE IF NOT EXISTS verifications (
                id TEXT PRIMARY KEY,
                resident_id TEXT NOT NULL,
                access_code TEXT NOT NULL,
                visit_date INTEGER NOT NULL,
                validity_period INTEGER NOT NULL,
                created_at INTEGER NOT NULL,
                synced INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (resident_id) REFERENCES residents (id)
              )`
            );

            // Update version
            await db.execAsync('INSERT INTO db_version (version) VALUES (2)');
          }
        });
        
        setDatabase(db);
        setLoading(false);
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

  // Save a new verification to the database or update if access code exists
  const saveVerification = async (params: Omit<Verification, 'id' | 'synced'>): Promise<Verification> => {
    if (database === null) {
      throw new Error('Database not initialized');
    }

    // Check if a verification with this access code already exists
    const existing = await database.getFirstAsync<Verification>(
      'SELECT * FROM verifications WHERE access_code = ?',
      [params.access_code]
    );

    if (existing) {
      // Update existing verification
      const updatedVerification: Verification = {
        ...existing,
        resident_id: params.resident_id,
        visit_date: params.visit_date,
        validity_period: params.validity_period,
        created_at: Date.now(), // Update the creation time
        synced: false // Reset sync status since we're updating
      };

      await database.runAsync(
        `UPDATE verifications 
         SET resident_id = ?,
             visit_date = ?,
             validity_period = ?,
             created_at = ?,
             synced = ?
         WHERE access_code = ?`,
        [
          updatedVerification.resident_id,
          updatedVerification.visit_date,
          updatedVerification.validity_period,
          updatedVerification.created_at,
          0, // synced = false
          params.access_code
        ]
      );

      return updatedVerification;
    }

    // If no existing verification, create a new one
    const id = generateUniqueId();
    const newVerification: Verification = {
      id,
      ...params,
      synced: false
    };

    await database.runAsync(
      `INSERT INTO verifications (
        id,
        resident_id,
        access_code,
        visit_date,
        validity_period,
        created_at,
        synced
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        newVerification.id,
        newVerification.resident_id,
        newVerification.access_code,
        newVerification.visit_date,
        newVerification.validity_period,
        newVerification.created_at,
        0 // synced = false
      ]
    );

    return newVerification;
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

  // Get all residents from the database
  const getResidents = async (): Promise<Resident[]> => {
    if (database === null) {
      throw new Error('Database not initialized');
    }

    const result: Resident[] = await database.getAllAsync(
      'SELECT * FROM residents'
    );

    return result.map(item => ({
      id: item.id,
      full_name: item.full_name,
      phone_number: item.phone_number,
      secret: item.secret,
      assigned_units: item.assigned_units,
      synced: Boolean(item.synced),
      last_sync: item.last_sync,
    }));
  };

  // Get all verifications from the database
  const getVerifications = async (): Promise<Verification[]> => {
    if (database === null) {
      throw new Error('Database not initialized');
    }

    const result = await database.getAllAsync<Verification>(
      'SELECT * FROM verifications ORDER BY created_at DESC'
    );

    return result.map(item => ({
      ...item,
      synced: Boolean(item.synced)
    }));
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
    saveVerification,
    getVerifications,
    getResidents,
    saveResident,
    deleteSyncedRecord,
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
