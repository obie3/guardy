import * as Crypto from 'expo-crypto';
import base32 from 'hi-base32';

interface TOTPOptions {
  digits?: number;
  period?: number;
  algorithm?: Crypto.CryptoDigestAlgorithm | 'SHA-1' | 'SHA-256' | 'SHA-512';
}

export async function generateTOTP(
  secret: string,
  options: TOTPOptions = {}
): Promise<string> {
  const {
    digits = 6,
    period = 30,
    algorithm = Crypto.CryptoDigestAlgorithm.SHA1,
  } = options;

  // Map string algorithms to enum if needed
  const cryptoAlgorithm =
    typeof algorithm === 'string' ? mapStringToAlgorithm(algorithm) : algorithm;

  // Get current time counter
  const counter = Math.floor(Date.now() / 1000 / period);

  // Convert counter to 8-byte buffer
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, BigInt(counter), false);

  // Decode base32 secret
  const key = base32.decode.asBytes(secret.replace(/\s/g, '').toUpperCase());

  // Create HMAC (using expo-crypto)
  const hmac = await Crypto.digestStringAsync(
    cryptoAlgorithm,
    new Uint8Array([...key, ...new Uint8Array(buffer)]).toString()
  );

  // Extract dynamic binary code
  const hmacBytes = hexToBytes(hmac);
  const offset = hmacBytes[hmacBytes.length - 1] & 0xf;
  const code =
    ((hmacBytes[offset] & 0x7f) << 24) |
    ((hmacBytes[offset + 1] & 0xff) << 16) |
    ((hmacBytes[offset + 2] & 0xff) << 8) |
    (hmacBytes[offset + 3] & 0xff);

  // Generate OTP
  const otp = (code % Math.pow(10, digits)).toString().padStart(digits, '0');

  return otp;
}

function mapStringToAlgorithm(algorithm: string): Crypto.CryptoDigestAlgorithm {
  const algorithmMap: Record<string, Crypto.CryptoDigestAlgorithm> = {
    'SHA-1': Crypto.CryptoDigestAlgorithm.SHA1,
    'SHA-256': Crypto.CryptoDigestAlgorithm.SHA256,
    'SHA-512': Crypto.CryptoDigestAlgorithm.SHA512,
  };

  return algorithmMap[algorithm] || Crypto.CryptoDigestAlgorithm.SHA1;
}

function hexToBytes(hex: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return bytes;
}
