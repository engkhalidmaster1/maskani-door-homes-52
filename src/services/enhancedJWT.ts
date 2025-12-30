import { jwtVerify, SignJWT } from 'jose';
import { dataEncryption } from './dataEncryption';

/**
 * Enhanced JWT Service with encryption and advanced security features
 */

export interface JWTPayload {
  sub: string; // User ID
  email?: string;
  role?: string;
  permissions?: string[];
  iat: number; // Issued at
  exp: number; // Expires at
  iss: string; // Issuer
  aud: string; // Audience
  jti: string; // JWT ID (unique token identifier)
  sid: string; // Session ID
  ip?: string; // Client IP
  ua?: string; // User Agent hash
  device?: string; // Device fingerprint
  [key: string]: unknown; // Index signature for jose compatibility
}

export interface RefreshTokenPayload {
  sub: string;
  sid: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
  jti: string;
  type: 'refresh';
  [key: string]: unknown; // Index signature for jose compatibility
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface TokenValidationResult {
  isValid: boolean;
  payload?: JWTPayload;
  error?: string;
  needsRefresh?: boolean;
}

export class EnhancedJWTService {
  private static instance: EnhancedJWTService;
  private readonly secret: Uint8Array;
  private readonly issuer = 'maskani-app';
  private readonly audience = 'maskani-users';
  private readonly accessTokenTTL = 15 * 60; // 15 minutes
  private readonly refreshTokenTTL = 7 * 24 * 60 * 60; // 7 days
  
  // In-memory store for token blacklist and active sessions
  private blacklistedTokens = new Set<string>();
  private activeSessions = new Map<string, {
    userId: string;
    deviceFingerprint: string;
    lastActivity: number;
    issuedAt: number;
  }>();

  private constructor() {
    // Get or generate JWT secret
    this.secret = this.getOrGenerateSecret();
    this.loadBlacklistFromStorage();
    this.startCleanupInterval();
  }

  public static getInstance(): EnhancedJWTService {
    if (!EnhancedJWTService.instance) {
      EnhancedJWTService.instance = new EnhancedJWTService();
    }
    return EnhancedJWTService.instance;
  }

  /**
   * Get or generate JWT secret key
   */
  private getOrGenerateSecret(): Uint8Array {
    let secret = localStorage.getItem('jwt_secret');
    
    if (!secret) {
      // Generate new 256-bit secret
      const newSecret = dataEncryption.generateSecureToken(32);
      secret = dataEncryption.encrypt(newSecret);
      localStorage.setItem('jwt_secret', secret);
      localStorage.setItem('jwt_secret_created', Date.now().toString());
    }
    
    try {
      const decryptedSecret = dataEncryption.decrypt<string>(secret);
      return new TextEncoder().encode(decryptedSecret);
    } catch (error) {
      console.error('Failed to decrypt JWT secret, regenerating...');
      localStorage.removeItem('jwt_secret');
      return this.getOrGenerateSecret();
    }
  }

  /**
   * Generate device fingerprint
   */
  private generateDeviceFingerprint(): string {
    const components = [
      navigator.userAgent,
      navigator.language,
      navigator.platform,
      screen.width.toString(),
      screen.height.toString(),
      new Date().getTimezoneOffset().toString()
    ];
    
    return dataEncryption.hash(components.join('|'));
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return dataEncryption.generateSecureToken(32);
  }

  /**
   * Create token pair (access + refresh tokens)
   */
  public async createTokenPair(
    userId: string,
    email?: string,
    role?: string,
    permissions?: string[],
    clientInfo?: {
      ip?: string;
      userAgent?: string;
    }
  ): Promise<TokenPair> {
    const now = Math.floor(Date.now() / 1000);
    const sessionId = this.generateSessionId();
    const deviceFingerprint = this.generateDeviceFingerprint();
    const tokenId = dataEncryption.generateSecureToken(16);
    const refreshTokenId = dataEncryption.generateSecureToken(16);

    // Store session info
    this.activeSessions.set(sessionId, {
      userId,
      deviceFingerprint,
      lastActivity: now,
      issuedAt: now
    });

    // Create access token payload
    const accessPayload: JWTPayload = {
      sub: userId,
      email,
      role,
      permissions,
      iat: now,
      exp: now + this.accessTokenTTL,
      iss: this.issuer,
      aud: this.audience,
      jti: tokenId,
      sid: sessionId,
      ip: clientInfo?.ip,
      ua: clientInfo?.userAgent ? dataEncryption.hash(clientInfo.userAgent) : undefined,
      device: deviceFingerprint
    };

    // Create refresh token payload
    const refreshPayload: RefreshTokenPayload = {
      sub: userId,
      sid: sessionId,
      iat: now,
      exp: now + this.refreshTokenTTL,
      iss: this.issuer,
      aud: this.audience,
      jti: refreshTokenId,
      type: 'refresh'
    };

    // Sign tokens
    const accessToken = await new SignJWT(accessPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .sign(this.secret);

    const refreshToken = await new SignJWT(refreshPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .sign(this.secret);

    // Encrypt tokens before returning
    const encryptedAccessToken = dataEncryption.encryptToken(accessToken);
    const encryptedRefreshToken = dataEncryption.encryptToken(refreshToken);

    return {
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresIn: this.accessTokenTTL,
      tokenType: 'Bearer'
    };
  }

  /**
   * Validate and decode token
   */
  public async validateToken(encryptedToken: string): Promise<TokenValidationResult> {
    try {
      // Decrypt token
      const token = dataEncryption.decryptToken(encryptedToken);
      if (!token) {
        return { isValid: false, error: 'Invalid token format' };
      }

      // Verify JWT signature and claims
      const { payload } = await jwtVerify(token, this.secret, {
        issuer: this.issuer,
        audience: this.audience
      });

      const jwtPayload = payload as JWTPayload;

      // Check if token is blacklisted
      if (this.blacklistedTokens.has(jwtPayload.jti)) {
        return { isValid: false, error: 'Token has been revoked' };
      }

      // Validate session
      const session = this.activeSessions.get(jwtPayload.sid);
      if (!session) {
        return { isValid: false, error: 'Session not found or expired' };
      }

      // Verify device fingerprint
      const currentFingerprint = this.generateDeviceFingerprint();
      if (session.deviceFingerprint !== currentFingerprint) {
        console.warn('Device fingerprint mismatch - possible session hijacking');
        // Don't immediately invalidate, but log for monitoring
      }

      // Update session activity
      session.lastActivity = Math.floor(Date.now() / 1000);

      // Check if token is close to expiration (needs refresh)
      const now = Math.floor(Date.now() / 1000);
      const needsRefresh = jwtPayload.exp - now < 300; // 5 minutes

      return {
        isValid: true,
        payload: jwtPayload,
        needsRefresh
      };

    } catch (error) {
      console.error('Token validation failed:', error);
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'Token validation failed' 
      };
    }
  }

  /**
   * Refresh access token using refresh token
   */
  public async refreshAccessToken(encryptedRefreshToken: string): Promise<TokenPair | null> {
    try {
      // Decrypt and verify refresh token
      const refreshToken = dataEncryption.decryptToken(encryptedRefreshToken);
      if (!refreshToken) {
        throw new Error('Invalid refresh token format');
      }

      const { payload } = await jwtVerify(refreshToken, this.secret, {
        issuer: this.issuer,
        audience: this.audience
      });

      const refreshPayload = payload as RefreshTokenPayload;

      // Verify it's a refresh token
      if (refreshPayload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if refresh token is blacklisted
      if (this.blacklistedTokens.has(refreshPayload.jti)) {
        throw new Error('Refresh token has been revoked');
      }

      // Validate session
      const session = this.activeSessions.get(refreshPayload.sid);
      if (!session) {
        throw new Error('Session not found or expired');
      }

      // Get user info from session
      const userId = refreshPayload.sub;

      // Create new token pair (this will generate new session)
      return await this.createTokenPair(userId);

    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  /**
   * Revoke token (add to blacklist)
   */
  public revokeToken(tokenId: string): void {
    this.blacklistedTokens.add(tokenId);
    this.saveBlacklistToStorage();
  }

  /**
   * Revoke all user tokens
   */
  public revokeAllUserTokens(userId: string): void {
    // Find and revoke all sessions for user
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        this.activeSessions.delete(sessionId);
      }
    }
    
    // Note: Individual token blacklisting would need to be tracked differently
    // for a complete solution
  }

  /**
   * Logout - revoke session
   */
  public async logout(encryptedToken: string): Promise<boolean> {
    try {
      const validation = await this.validateToken(encryptedToken);
      if (validation.isValid && validation.payload) {
        // Blacklist the token
        this.revokeToken(validation.payload.jti);
        
        // Remove session
        this.activeSessions.delete(validation.payload.sid);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Logout failed:', error);
      return false;
    }
  }

  /**
   * Get active sessions for user
   */
  public getUserActiveSessions(userId: string): Array<{
    sessionId: string;
    deviceFingerprint: string;
    lastActivity: Date;
    issuedAt: Date;
  }> {
    const userSessions = [];
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        userSessions.push({
          sessionId,
          deviceFingerprint: session.deviceFingerprint,
          lastActivity: new Date(session.lastActivity * 1000),
          issuedAt: new Date(session.issuedAt * 1000)
        });
      }
    }
    
    return userSessions;
  }

  /**
   * Load blacklist from storage
   */
  private loadBlacklistFromStorage(): void {
    try {
      const stored = localStorage.getItem('jwt_blacklist');
      if (stored) {
        const blacklistedArray = JSON.parse(stored);
        this.blacklistedTokens = new Set(blacklistedArray);
      }
    } catch (error) {
      console.error('Failed to load token blacklist:', error);
    }
  }

  /**
   * Save blacklist to storage
   */
  private saveBlacklistToStorage(): void {
    try {
      const blacklistedArray = Array.from(this.blacklistedTokens);
      localStorage.setItem('jwt_blacklist', JSON.stringify(blacklistedArray));
    } catch (error) {
      console.error('Failed to save token blacklist:', error);
    }
  }

  /**
   * Start cleanup interval for expired tokens and sessions
   */
  private startCleanupInterval(): void {
    // Clean up every hour
    setInterval(() => {
      this.cleanupExpiredTokensAndSessions();
    }, 60 * 60 * 1000);
  }

  /**
   * Cleanup expired tokens and sessions
   */
  private cleanupExpiredTokensAndSessions(): void {
    const now = Math.floor(Date.now() / 1000);
    
    // Clean up old sessions (inactive for more than 24 hours)
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now - session.lastActivity > 24 * 60 * 60) {
        this.activeSessions.delete(sessionId);
      }
    }
    
    // Note: Blacklist cleanup would require storing expiration times
    // For now, we keep all blacklisted tokens until app restart
  }

  /**
   * Generate secure password reset token
   */
  public generatePasswordResetToken(userId: string, email: string): string {
    const payload = {
      userId,
      email,
      type: 'password_reset',
      timestamp: Date.now()
    };
    
    return dataEncryption.encrypt(payload);
  }

  /**
   * Validate password reset token
   */
  public validatePasswordResetToken(
    token: string
  ): { isValid: boolean; userId?: string; email?: string } {
    try {
      const payload = dataEncryption.decrypt<{
        userId: string;
        email: string;
        type: string;
        timestamp: number;
      }>(token);
      
      // Check token type
      if (payload.type !== 'password_reset') {
        return { isValid: false };
      }
      
      // Check expiration (1 hour)
      const now = Date.now();
      if (now - payload.timestamp > 60 * 60 * 1000) {
        return { isValid: false };
      }
      
      return {
        isValid: true,
        userId: payload.userId,
        email: payload.email
      };
    } catch (error) {
      console.error('Password reset token validation failed:', error);
      return { isValid: false };
    }
  }
}

// Export singleton instance
export const jwtService = EnhancedJWTService.getInstance();