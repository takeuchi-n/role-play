import { authProvider } from './jwt-provider';
import { getSessionToken } from './cookies';
import type { SessionPayload } from './types';

/**
 * Get the current authenticated user from the session cookie
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<SessionPayload | null> {
  const token = await getSessionToken();

  if (!token) {
    return null;
  }

  return authProvider.verifyToken(token);
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<SessionPayload> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}
