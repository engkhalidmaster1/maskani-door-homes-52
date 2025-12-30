import CryptoJS from 'crypto-js';

/**
 * Secure data encryption service for sensitive user data
 * Uses AES encryption with secure key derivation
 */
export class DataEncryption {
  private static instance: DataEncryption;
  private encryptionKey: string;
  private readonly keyVersion = 'v1';

  private constructor() {
    // Generate or retrieve encryption key from secure storage
    this.encryptionKey = this.getOrGenerateKey();
  }

  public static getInstance(): DataEncryption {
    if (!DataEncryption.instance) {
      DataEncryption.instance = new DataEncryption();
    }
    return DataEncryption.instance;
  }

  /**
   * Get or generate a secure encryption key
   */
  private getOrGenerateKey(): string {
    const storedKey = localStorage.getItem('enc_key');
    
    if (storedKey) {
      try {
        // Verify key integrity
        const decryptedKey = CryptoJS.AES.decrypt(storedKey, this.getUserSalt()).toString(CryptoJS.enc.Utf8);
        if (decryptedKey && decryptedKey.length === 64) {
          return decryptedKey;
        }
      } catch (error) {
        console.warn('Invalid stored key, generating new one');
      }
    }

    // Generate new key
    const newKey = CryptoJS.lib.WordArray.random(32).toString();
    const encryptedKey = CryptoJS.AES.encrypt(newKey, this.getUserSalt()).toString();
    
    localStorage.setItem('enc_key', encryptedKey);
    localStorage.setItem('enc_key_version', this.keyVersion);
    
    return newKey;
  }

  /**
   * Get user-specific salt for key derivation
   */
  private getUserSalt(): string {
    const userAgent = navigator.userAgent;
    const timestamp = localStorage.getItem('first_visit') || Date.now().toString();
    return CryptoJS.SHA256(userAgent + timestamp + 'maskani_salt').toString();
  }

  /**
   * Encrypt sensitive data
   */
  public encrypt(data: unknown): string {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.encryptionKey).toString();
      
      // Add version and integrity check
      const payload = {
        version: this.keyVersion,
        data: encrypted,
        checksum: CryptoJS.SHA256(jsonString).toString().substring(0, 16)
      };
      
      return btoa(JSON.stringify(payload));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  public decrypt<T = unknown>(encryptedData: string): T {
    try {
      const payload = JSON.parse(atob(encryptedData));
      
      // Version check
      if (payload.version !== this.keyVersion) {
        throw new Error('Incompatible data version');
      }
      
      const decryptedBytes = CryptoJS.AES.decrypt(payload.data, this.encryptionKey);
      const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        throw new Error('Decryption failed - invalid key or corrupted data');
      }
      
      // Verify integrity
      const checksum = CryptoJS.SHA256(decryptedString).toString().substring(0, 16);
      if (checksum !== payload.checksum) {
        throw new Error('Data integrity check failed');
      }
      
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt form data before storing
   */
  public encryptFormData(formData: Record<string, unknown>): string {
    const sensitiveFields = [
      'password', 'pin', 'ssn', 'id_number', 'phone', 'email',
      'bank_account', 'credit_card', 'personal_id'
    ];

    const toEncrypt: Record<string, unknown> = {};
    const plainData: Record<string, unknown> = {};

    Object.entries(formData).forEach(([key, value]) => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        toEncrypt[key] = value;
      } else {
        plainData[key] = value;
      }
    });

    return JSON.stringify({
      plain: plainData,
      encrypted: toEncrypt ? this.encrypt(toEncrypt) : null,
      timestamp: Date.now()
    });
  }

  /**
   * Decrypt form data after retrieving
   */
  public decryptFormData(encryptedFormData: string): Record<string, unknown> {
    try {
      const parsed = JSON.parse(encryptedFormData);
      
      let decryptedSensitive = {};
      if (parsed.encrypted) {
        decryptedSensitive = this.decrypt(parsed.encrypted);
      }

      return {
        ...parsed.plain,
        ...decryptedSensitive
      };
    } catch (error) {
      console.error('Failed to decrypt form data:', error);
      return {};
    }
  }

  /**
   * Hash sensitive data for comparison (one-way)
   */
  public hash(data: string): string {
    return CryptoJS.SHA256(data + this.getUserSalt()).toString();
  }

  /**
   * Generate secure token
   */
  public generateSecureToken(length: number = 32): string {
    return CryptoJS.lib.WordArray.random(length).toString();
  }

  /**
   * Encrypt JWT tokens before storing
   */
  public encryptToken(token: string): string {
    const payload = {
      token,
      timestamp: Date.now(),
      userAgent: navigator.userAgent.substring(0, 100)
    };
    
    return this.encrypt(payload);
  }

  /**
   * Decrypt and validate JWT tokens
   */
  public decryptToken(encryptedToken: string): string | null {
    try {
      const payload = this.decrypt<{
        token: string;
        timestamp: number;
        userAgent: string;
      }>(encryptedToken);
      
      // Validate timestamp (token max age: 7 days)
      const maxAge = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - payload.timestamp > maxAge) {
        throw new Error('Token expired');
      }
      
      // Basic user agent validation
      const currentUA = navigator.userAgent.substring(0, 100);
      if (payload.userAgent !== currentUA) {
        console.warn('User agent mismatch - possible session hijacking');
        // Don't throw error, but log for security monitoring
      }
      
      return payload.token;
    } catch (error) {
      console.error('Token decryption failed:', error);
      return null;
    }
  }

  /**
   * Secure data wipe
   */
  public wipeEncryptionData(): void {
    try {
      // Clear encryption key
      localStorage.removeItem('enc_key');
      localStorage.removeItem('enc_key_version');
      
      // Regenerate key for next session
      this.encryptionKey = this.getOrGenerateKey();
      
      console.log('Encryption data wiped successfully');
    } catch (error) {
      console.error('Failed to wipe encryption data:', error);
    }
  }

  /**
   * Validate data integrity
   */
  public validateIntegrity(data: unknown, expectedChecksum: string): boolean {
    try {
      const calculated = CryptoJS.SHA256(JSON.stringify(data)).toString();
      return calculated === expectedChecksum;
    } catch (error) {
      console.error('Integrity validation failed:', error);
      return false;
    }
  }

  /**
   * Generate checksum for data
   */
  public generateChecksum(data: unknown): string {
    return CryptoJS.SHA256(JSON.stringify(data)).toString();
  }

  /**
   * Encrypt file content (for document uploads)
   */
  public encryptFile(file: File): Promise<{ encryptedData: string; metadata: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
          const encrypted = CryptoJS.AES.encrypt(wordArray, this.encryptionKey).toString();
          
          const metadata = {
            originalName: file.name,
            size: file.size,
            type: file.type,
            timestamp: Date.now(),
            checksum: CryptoJS.SHA256(wordArray).toString()
          };
          
          resolve({
            encryptedData: encrypted,
            metadata: this.encrypt(metadata)
          });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Decrypt file content
   */
  public decryptFile(encryptedData: string, encryptedMetadata: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        const metadata = this.decrypt<{
          originalName: string;
          size: number;
          type: string;
          timestamp: number;
          checksum: string;
        }>(encryptedMetadata);
        const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
        
        // Convert to ArrayBuffer
        const typedArray = new Uint8Array(decryptedBytes.sigBytes);
        for (let i = 0; i < decryptedBytes.sigBytes; i++) {
          typedArray[i] = (decryptedBytes.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
        }
        
        const blob = new Blob([typedArray], { type: metadata.type });
        resolve(blob);
      } catch (error) {
        reject(error);
      }
    });
  }
}

// Export singleton instance
export const dataEncryption = DataEncryption.getInstance();

// Utility functions for easy use
export const encryptData = (data: unknown): string => dataEncryption.encrypt(data);
export const decryptData = <T = unknown>(encryptedData: string): T => dataEncryption.decrypt<T>(encryptedData);
export const hashData = (data: string): string => dataEncryption.hash(data);
export const generateToken = (length?: number): string => dataEncryption.generateSecureToken(length);