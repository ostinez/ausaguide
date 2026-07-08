// Helper to decode Base32 into byte array
function base32ToBuf(base32: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (let i = 0; i < base32.length; i++) {
    const val = alphabet.indexOf(base32[i].toUpperCase());
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const buf = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < buf.length; i++) {
    buf[i] = parseInt(bits.substring(i * 8, (i + 1) * 8), 2);
  }
  return buf;
}

// Generate Google Authenticator compatible secret key
export function generateBase32Secret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  for (let i = 0; i < 16; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)];
  }
  return secret;
}

// Generate random backup codes (format: xxxx-xxxx)
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  for (let c = 0; c < 8; c++) {
    let code = "";
    for (let i = 0; i < 8; i++) {
      if (i === 4) code += "-";
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    codes.push(code);
  }
  return codes;
}

// Verify TOTP code
export async function verifyTOTP(secret: string, code: string): Promise<boolean> {
  if (!secret || !code) return false;
  const cleanCode = code.trim().replace(/\s+/g, "");
  if (cleanCode.length !== 6 || !/^\d+$/.test(cleanCode)) return false;

  try {
    const keyBytes = base32ToBuf(secret);
    const counter = Math.floor(Date.now() / 30000);
    const cryptoProvider = typeof window !== "undefined" ? window.crypto : (globalThis as any).crypto;

    if (!cryptoProvider || !cryptoProvider.subtle) {
      console.error("Cryptography provider or SubtleCrypto not available.");
      return false;
    }

    // Verify code with standard drift window of -1, 0, +1
    for (let drift = -1; drift <= 1; drift++) {
      const c = BigInt(counter + drift);
      const msgBytes = new Uint8Array(8);
      let temp = c;
      for (let i = 7; i >= 0; i--) {
        msgBytes[i] = Number(temp & 0xffn);
        temp >>= 8n;
      }

      const cryptoKey = await cryptoProvider.subtle.importKey(
        "raw",
        keyBytes,
        { name: "HMAC", hash: { name: "SHA-1" } },
        false,
        ["sign"]
      );

      const sig = await cryptoProvider.subtle.sign("HMAC", cryptoKey, msgBytes);
      const sigBytes = new Uint8Array(sig);
      const offset = sigBytes[sigBytes.length - 1] & 0xf;
      const binary =
        ((sigBytes[offset] & 0x7f) << 24) |
        ((sigBytes[offset + 1] & 0xff) << 16) |
        ((sigBytes[offset + 2] & 0xff) << 8) |
        (sigBytes[offset + 3] & 0xff);

      const otp = (binary % 1000000).toString().padStart(6, '0');
      if (otp === cleanCode) {
        return true;
      }
    }
  } catch (err) {
    console.error("TOTP verification error:", err);
  }
  return false;
}
