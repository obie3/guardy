// Interfaces for database entities

export interface Scan {
  id: string;
  access_code: string;
  timestamp: number;
  synced: boolean;
}

export interface Resident {
  id: string;
  full_name: string;
  phone_number: string;
  secret: string;
  assigned_units: string;
  synced: boolean;
  last_sync: number;
}

export interface User {
  id: string;
  userId: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LogEntry {
  id: string;
  residentName: string;
  unit: string;
  visitDate: Date;
  numberOfGuests: number;
  accessCode: string;
  validityPeriod: string;
  status: 'pending' | 'verified' | 'expired';
  timestamp: number;
}

export interface AuthDevice {
  id: string;
  device_code: string;
  estate_id: string;
  name?: string;
  status: string;
  created_at?: string;
  last_synced_at?: string;
}

// Type definitions for database operations
export type SaveScanFunction = (access_code: string) => Promise<Scan>;
export type GetScansFunction = () => Promise<Scan[]>;
export type AddScansFunction = () => Promise<Scan[]>;
