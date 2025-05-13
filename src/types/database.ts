// Interfaces for database entities

export interface Estate {
  id: string;
  name: string;
  address: string;
  created_at?: string;
  updated_at?: string;
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

export interface Verification {
  id: string;
  resident_id: string;
  access_code: string;
  visit_date: number;
  validity_period: number;
  created_at: number;
  synced: boolean;
}

// Type definitions for database operations
export type SaveVerificationFunction = (verification: Omit<Verification, 'id' | 'synced'>) => Promise<Verification>;
export type GetVerificationsFunction = () => Promise<Verification[]>;
