import * as Crypto from 'expo-crypto';
import 'fast-text-encoding';

// Supabase's PKCE implementation expects this subset of WebCrypto on native.
const nativeCrypto = globalThis.crypto || {};
if (!nativeCrypto.getRandomValues) nativeCrypto.getRandomValues = Crypto.getRandomValues;
if (!nativeCrypto.subtle) {
  nativeCrypto.subtle = {
    digest(algorithm, data) {
      if (algorithm !== 'SHA-256') throw new Error('Unsupported digest');
      return Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, data);
    },
  };
}
globalThis.crypto = nativeCrypto;
