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
  name?: string;
  // location?: string;
  status: string;
  created_at?: string;
  last_synced_at?: string;
}

// Type definitions for database operations
export type SaveScanFunction = (access_code: string) => Promise<Scan>;
export type GetScansFunction = () => Promise<Scan[]>;
export type AddScansFunction = () => Promise<Scan[]>;
