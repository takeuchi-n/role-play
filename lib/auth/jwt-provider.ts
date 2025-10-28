import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db/client';
import type { AuthProvider, SessionPayload } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d'; // 7 days

export class JwtAuthProvider implements AuthProvider {
  async createSession(userId: string, email: string): Promise<{ token: string; expiresAt: Date }> {
    // Create session in database first
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const payload: Omit<SessionPayload, 'sessionId'> = {
      userId,
      email,
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      algorithm: 'HS256',
    });

    // Store session in database
    await prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    return { token, expiresAt };
  }

  async verifyToken(token: string): Promise<SessionPayload | null> {
    try {
      // Verify JWT signature and expiration
      const decoded = jwt.verify(token, JWT_SECRET, {
        algorithms: ['HS256'],
      }) as Omit<SessionPayload, 'sessionId'>;

      // Check if session exists in database and is not expired
      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!session) {
        return null;
      }

      if (session.expiresAt < new Date()) {
        // Session expired, delete it
        await prisma.session.delete({ where: { id: session.id } });
        return null;
      }

      return {
        userId: session.userId,
        sessionId: session.id,
        email: session.user.email,
      };
    } catch {
      return null;
    }
  }

  async revokeSession(token: string): Promise<void> {
    try {
      await prisma.session.delete({
        where: { token },
      });
    } catch {
      // Session not found or already deleted
    }
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }
}

// Singleton instance
export const authProvider = new JwtAuthProvider();
