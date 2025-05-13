import { Resident } from '../types/database';
import { TokenPeriod, VerificationResult, Visit } from '../types/verification';
import base32Decode from 'base32-decode';
import base32Encode from 'base32-encode';
import { TOTP } from 'totp-generator';

/**
 * Appends visitor ID to base32 secret for enhanced security
 */
export const appendVisitorId = (secret: string, visitorId: string): string => {
  // First decode the base32 secret to get the original bytes
  const secretBytes = new Uint8Array(base32Decode(secret, 'RFC4648'));
  
  // Extract numeric part from visitor ID (e.g., "G001" -> "01")
  const numericId = visitorId.replace(/\D/g, '').padStart(2, '0').slice(-2);
  const visitorByte = new Uint8Array([parseInt(numericId, 10)]);
  
  // Combine the secret bytes with the visitor ID byte
  const combinedBytes = new Uint8Array(secretBytes.length + 1);
  combinedBytes.set(secretBytes);
  combinedBytes.set(visitorByte, secretBytes.length);
  
  // Convert back to base32
  return base32Encode(combinedBytes, 'RFC4648', { padding: true });
};

/**
 * Verifies a TOTP token against all residents' secrets
 * Tries different visitor IDs and validity periods to find a match
 */
export const verifyTOTP = async (token: string, residents: Resident[]): Promise<VerificationResult> => {
  // Try each resident's secret
  for (const resident of residents) {
    // Try all possible visitor IDs (01-99)
    for (let i = 1; i <= 99; i++) {
      const testVisitorId = i.toString().padStart(2, '0');
      const testSecret = appendVisitorId(resident.secret, testVisitorId);
      
      // Try different validity periods
      for (const period of [10, 1800, 7200] as TokenPeriod[]) {
        try {
          const totpOptions = {
            period,
            digits: 6,
            algorithm: 'SHA-256' as const
          };
          
          const { otp } = TOTP.generate(testSecret, totpOptions);
          
          if (otp === token) {
            return {
              success: true,
              message: 'Token verified successfully',
              resident,
              visit: {
                guest: { id: `G${testVisitorId}`, name: `Guest ${testVisitorId}` },
                visitDate: new Date(),
                validityPeriod: period
              }
            };
          }
        } catch (error) {
          console.error('Error checking combination:', error);
        }
      }
    }
  }
  
  return {
    success: false,
    message: 'Invalid token'
  };
};
