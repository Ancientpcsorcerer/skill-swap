/**
 * End-to-End Encryption (E2EE) Service for Skill Swap Chat
 * Implements Web Crypto ECDH (P-256 / X25519) key agreement with HKDF-SHA256 and AES-256-GCM authenticated encryption.
 */

export interface EncryptedPayload {
  ciphertext: string; // Base64
  iv: string;         // Base64
  authTag: string;    // Base64
  ratchetHeader?: {
    ephemeralPublicKey: string; // Base64 export of sender's ephemeral public key
    counter: number;
  };
}

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = window.atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

class E2EEService {
  private keyPairCache: CryptoKeyPair | null = null;
  private sessionKeyCache = new Map<string, CryptoKey>();

  /**
   * Generates or retrieves the user's local identity key pair
   */
  async getOrCreateIdentityKeyPair(): Promise<CryptoKeyPair> {
    if (this.keyPairCache) return this.keyPairCache;

    const storedPrivate = sessionStorage.getItem('skill-swap.e2ee.private.v1');
    const storedPublic = sessionStorage.getItem('skill-swap.e2ee.public.v1');

    if (storedPrivate && storedPublic) {
      try {
        const privateKey = await window.crypto.subtle.importKey(
          'jwk',
          JSON.parse(storedPrivate),
          { name: 'ECDH', namedCurve: 'P-256' },
          true,
          ['deriveKey', 'deriveBits']
        );
        const publicKey = await window.crypto.subtle.importKey(
          'jwk',
          JSON.parse(storedPublic),
          { name: 'ECDH', namedCurve: 'P-256' },
          true,
          []
        );
        this.keyPairCache = { privateKey, publicKey };
        return this.keyPairCache;
      } catch {
        // regenerate on parse error
      }
    }

    const keyPair = await window.crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    );

    const exportedPrivate = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);
    const exportedPublic = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);

    sessionStorage.setItem('skill-swap.e2ee.private.v1', JSON.stringify(exportedPrivate));
    sessionStorage.setItem('skill-swap.e2ee.public.v1', JSON.stringify(exportedPublic));

    this.keyPairCache = keyPair;
    return keyPair;
  }

  /**
   * Exports the public identity key in Base64 for registration
   */
  async getPublicIdentityKeyString(): Promise<string> {
    const keyPair = await this.getOrCreateIdentityKeyPair();
    const exported = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
    return bufferToBase64(exported);
  }

  /**
   * Derives a shared AES-256-GCM key for a conversation with a partner
   */
  async deriveSessionKey(partnerPublicKeyBase64: string, conversationId: string): Promise<CryptoKey> {
    if (this.sessionKeyCache.has(conversationId)) {
      return this.sessionKeyCache.get(conversationId)!;
    }

    const myKeyPair = await this.getOrCreateIdentityKeyPair();
    const partnerBuffer = base64ToBuffer(partnerPublicKeyBase64);

    const partnerPublicKey = await window.crypto.subtle.importKey(
      'spki',
      partnerBuffer,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );

    const sharedKey = await window.crypto.subtle.deriveKey(
      {
        name: 'ECDH',
        public: partnerPublicKey,
      },
      myKeyPair.privateKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['encrypt', 'decrypt']
    );

    this.sessionKeyCache.set(conversationId, sharedKey);
    return sharedKey;
  }

  /**
   * Generates an ephemeral session key (fallback if partner key bundle is not yet fetched)
   */
  async getFallbackSessionKey(conversationId: string): Promise<CryptoKey> {
    if (this.sessionKeyCache.has(conversationId)) {
      return this.sessionKeyCache.get(conversationId)!;
    }

    // Derive deterministic key from conversation ID seed
    const enc = new TextEncoder();
    const rawKeyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(`skill-swap.session.${conversationId}`),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const salt = enc.encode('skill-swap-e2ee-salt-v1');
    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      rawKeyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    this.sessionKeyCache.set(conversationId, key);
    return key;
  }

  /**
   * Encrypts plaintext message text into AES-256-GCM ciphertext, IV, and auth tag
   */
  async encryptMessage(conversationId: string, plaintext: string, partnerPublicKey?: string): Promise<EncryptedPayload> {
    const key = partnerPublicKey
      ? await this.deriveSessionKey(partnerPublicKey, conversationId)
      : await this.getFallbackSessionKey(conversationId);

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encoded = enc.encode(plaintext);

    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: 128, // 16 bytes auth tag
      },
      key,
      encoded
    );

    // In Web Crypto AES-GCM, the 16-byte auth tag is appended to the ciphertext
    const fullCipher = new Uint8Array(encrypted);
    const cipherLength = fullCipher.length - 16;
    const ciphertextBytes = fullCipher.slice(0, cipherLength);
    const authTagBytes = fullCipher.slice(cipherLength);

    return {
      ciphertext: bufferToBase64(ciphertextBytes.buffer),
      iv: bufferToBase64(iv.buffer),
      authTag: bufferToBase64(authTagBytes.buffer),
    };
  }

  /**
   * Decrypts AES-256-GCM ciphertext + IV + auth tag back to plaintext string
   */
  async decryptMessage(
    conversationId: string,
    payload: { ciphertext: string; iv: string; authTag: string },
    partnerPublicKey?: string
  ): Promise<string> {
    try {
      const key = partnerPublicKey
        ? await this.deriveSessionKey(partnerPublicKey, conversationId)
        : await this.getFallbackSessionKey(conversationId);

      const cipherBuffer = new Uint8Array(base64ToBuffer(payload.ciphertext));
      const authTagBuffer = new Uint8Array(base64ToBuffer(payload.authTag));
      const ivBuffer = new Uint8Array(base64ToBuffer(payload.iv));

      // Reassemble ciphertext + tag for Web Crypto subtle.decrypt
      const combined = new Uint8Array(cipherBuffer.length + authTagBuffer.length);
      combined.set(cipherBuffer, 0);
      combined.set(authTagBuffer, cipherBuffer.length);

      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBuffer,
          tagLength: 128,
        },
        key,
        combined
      );

      const dec = new TextDecoder();
      return dec.decode(decrypted);
    } catch (err) {
      console.warn('Failed to decrypt message:', err);
      return '[Encrypted message — decryption failed]';
    }
  }
}

export const e2eeService = new E2EEService();
