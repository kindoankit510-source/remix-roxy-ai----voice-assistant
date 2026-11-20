/**
 * Utility functions for 16-bit PCM audio conversion and Web Audio API buffer operations.
 */

// Convert Float32Array (-1.0 to 1.0) to 16-bit PCM Base64 string for Gemini Live API
export function float32ToPcm16Base64(float32Array: Float32Array): string {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  
  const bytes = new Uint8Array(int16Array.buffer);
  let binary = '';
  const chunkSize = 0x8000; // process in chunks to prevent max stack exceeded
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(sub));
  }
  return btoa(binary);
}

// Convert Base64 16-bit PCM (24kHz Little Endian) from Gemini Live API to Float32Array for Web Audio API
export function pcm16Base64ToFloat32(base64String: string): Float32Array {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const dataView = new DataView(bytes.buffer);
  const numSamples = Math.floor(len / 2);
  const float32Array = new Float32Array(numSamples);
  
  for (let i = 0; i < numSamples; i++) {
    const int16 = dataView.getInt16(i * 2, true); // Little-Endian
    float32Array[i] = int16 / 32768.0;
  }
  
  return float32Array;
}
