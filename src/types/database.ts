// Interfaces for database entities

export interface Scan {
  id: string;
  access_code: string;
  timestamp: number;
  synced: boolean;
}

export interface Resident {
  id?: string;
  first_name: string;
  last_name: string;
  house_number: string;
  street_name: string;
}

export interface User {
  id: string;
  userId: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

// Type definitions for database operations
export type SaveScanFunction = (access_code: string) => Promise<Scan>;
export type GetScansFunction = () => Promise<Scan[]>;
export type AddScansFunction = () => Promise<Scan[]>;
// export type GetScanByIdFunction = (id: string) => Promise<Scan | null>;
// export type GetUnsyncedFunction = () => Promise<Scan[]>;
// export type MarkAsSyncedFunction = (id: string) => Promise<void>;
