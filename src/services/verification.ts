import { Resident } from '../types/database';
import { TokenPeriod, VerificationResult, Visit } from '../types/verification';
import base32Decode from 'base32-decode';
import base32Encode from 'base32-encode';
import { generateTOTP } from '../utils/totp';

/**
 * Appends visitor ID to base32 secret for enhanced security
 */
const appendVisitorId = (secret: string, visitorId: string): string => {
  console.log(
    '[totpUtils.ts] appendVisitorId called with secret:',
    secret,
    'visitorId:',
    visitorId
  );
  // First decode the base32 secret to get the original bytes
  const secretBytes = new Uint8Array(base32Decode(secret, 'RFC4648'));
  console.log('[totpUtils.ts] secretBytes:', secretBytes);

  let numericId: string;
  // Check if visitorId looks like a UUID (e.g., 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx')
  // UUIDs are typically 36 characters long and contain hyphens.
  if (visitorId.length === 36 && visitorId.includes('-')) {
    // New logic for UUID: extract from last two hex characters
    const hexPart = visitorId.slice(-2); // e.g., from '...3f4', hexPart is 'f4'
    const decimalValue = parseInt(hexPart, 16); // e.g., parseInt('f4', 16) = 244

    // Map to a range of 1-99
    // (decimalValue % 99) results in a number from 0 to 98.
    // Add 1 to shift the range to 1 to 99.
    const valueIn_1_99_Range = (decimalValue % 99) + 1;
    numericId = valueIn_1_99_Range.toString().padStart(2, '0');
  } else {
    // Fallback to original logic for other formats (e.g., "G001", "01", etc.)
    // This ensures that calls from verifyTOTP (with "01", "02", etc.) still work.
    numericId = visitorId.replace(/\\D/g, '').padStart(2, '0').slice(-2);
  }
  console.log('[totpUtils.ts] numericId:', numericId);
  const visitorByte = new Uint8Array([parseInt(numericId, 10)]);
  console.log('[totpUtils.ts] visitorByte:', visitorByte);

  // Combine the secret bytes with the visitor ID byten
  const combinedBytes = new Uint8Array(secretBytes.length + 1);
  combinedBytes.set(secretBytes);
  combinedBytes.set(visitorByte, secretBytes.length);
  console.log('[totpUtils.ts] combinedBytes:', combinedBytes);

  // Convert back to base32
  const result = base32Encode(combinedBytes, 'RFC4648', { padding: true });
  console.log('[totpUtils.ts] appendVisitorId result:', result);
  return result;
};

/**
 * Verifies a TOTP token against all residents' secrets
 * Tries different visitor IDs and validity periods to find a match
 */
export const verifyTOTP = async (
  token: string,
  residents: Resident[]
): Promise<VerificationResult> => {
  console.log(`Verifying token: ${token}`);
  // Try each resident's secret
  for (const resident of residents) {
    console.log(`Checking resident: ${resident.id}`);
    // Try all possible visitor IDs (01-99)
    for (let i = 1; i <= 99; i++) {
      const testVisitorId = i.toString().padStart(2, '0');
      console.log(`Trying visitorId: ${testVisitorId}`);
      const testSecret = appendVisitorId(resident.secret, testVisitorId);

      console.log(`Combined secret: ${testSecret}`);

      console.log(
        `Testing secret: ${resident.secret} with visitorId: ${testVisitorId}`
      );

      // Try different validity periods
      for (const period of [10, 1800, 7200] as TokenPeriod[]) {
        console.log(`    Trying period: ${period}`);
        try {
          const totpOptions = {
            period,
            digits: 6,
            algorithm: 'SHA-256' as const,
          };

          //const { TOTP } = OTPAuth;
          const otp = await generateTOTP(testSecret, totpOptions);
          // const { otp } = TOTP.generate(testSecret, totpOptions);
          console.log(`Generated OTP: ${otp}`);

          if (otp === token) {
            console.log('Token match found!');
            return {
              success: true,
              message: 'Token verified successfully',
              resident,
              visit: {
                guest: {
                  id: `G${testVisitorId}`,
                  name: `Guest ${testVisitorId}`,
                },
                visitDate: new Date(),
                validityPeriod: period,
              },
            };
          }
        } catch (error) {
          console.error('Error checking combination:', error);
        }
      }
    }
  }

  console.log('No match found for token.');
  return {
    success: false,
    message: 'Invalid token',
  };
};
