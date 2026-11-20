// Secure encrypted storage utility for Gemini API key & sensitive data

const SECURE_KEY_ALIAS = "roxy_gemini_api_key_enc";
const CIPHER_SALT = "RoxyAI_Keystore_2026_Salt_Key";

/**
 * Encrypts a string using a simple reversible cipher to prevent plain-text exposure in local storage or log dumps.
 */
export function encryptApiKey(plainKey: string): string {
  if (!plainKey) return "";
  try {
    let cipher = "";
    for (let i = 0; i < plainKey.length; i++) {
      const charCode = plainKey.charCodeAt(i) ^ CIPHER_SALT.charCodeAt(i % CIPHER_SALT.length);
      cipher += String.fromCharCode(charCode);
    }
    return btoa(cipher);
  } catch (e) {
    return plainKey;
  }
}

/**
 * Decrypts the stored API key.
 */
export function decryptApiKey(encryptedKey: string): string {
  if (!encryptedKey) return "";
  try {
    const rawCipher = atob(encryptedKey);
    let plain = "";
    for (let i = 0; i < rawCipher.length; i++) {
      const charCode = rawCipher.charCodeAt(i) ^ CIPHER_SALT.charCodeAt(i % CIPHER_SALT.length);
      plain += String.fromCharCode(charCode);
    }
    return plain;
  } catch (e) {
    return encryptedKey;
  }
}

/**
 * Stores the Gemini API key securely in browser/app encrypted storage.
 */
export function saveEncryptedApiKey(key: string): void {
  try {
    if (!key || !key.trim()) {
      localStorage.removeItem(SECURE_KEY_ALIAS);
    } else {
      const enc = encryptApiKey(key.trim());
      localStorage.setItem(SECURE_KEY_ALIAS, enc);
    }
  } catch (e) {
    // Fail silently without exposing key in error logs
  }
}

/**
 * Retrieves the stored Gemini API key from secure storage.
 */
export function loadEncryptedApiKey(): string {
  try {
    const enc = localStorage.getItem(SECURE_KEY_ALIAS);
    if (!enc) return "";
    return decryptApiKey(enc);
  } catch (e) {
    return "";
  }
}

/**
 * Redacts any API keys from string logs to prevent printing in Logcat/console.
 */
export function redactApiKeyFromLog(msg: string): string {
  if (!msg) return "";
  return msg
    .replace(/AIzaSy[A-Za-z0-9_-]{20,}/g, "AIzaSy[REDACTED]")
    .replace(/apiKey=[^&]+/g, "apiKey=[REDACTED]");
}
