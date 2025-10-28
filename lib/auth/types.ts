export interface SessionPayload {
  userId: string;
  sessionId: string;
  email: string;
}

export interface AuthProvider {
  /**
   * Create a new session for a user
   */
  createSession(userId: string, email: string): Promise<{ token: string; expiresAt: Date }>;

  /**
   * Verify a token and return the session payload
   */
  verifyToken(token: string): Promise<SessionPayload | null>;

  /**
   * Revoke a session by token
   */
  revokeSession(token: string): Promise<void>;

  /**
   * Revoke all sessions for a user
   */
  revokeAllSessions(userId: string): Promise<void>;
}
