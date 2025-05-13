// Type definitions for the verification process

import { Resident } from './database';

export type TokenPeriod = 10 | 1800 | 7200; // 10 seconds, 30 minutes, 2 hours

export interface Visit {
  guest: {
    id: string;
    name: string;
  };
  visitDate: Date;
  validityPeriod: TokenPeriod;
}

export interface VerificationResult {
  success: boolean;
  message: string;
  resident?: Resident;
  visit?: Visit;
}
