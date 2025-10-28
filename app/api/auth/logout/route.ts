import { NextResponse } from 'next/server';
import { getSessionToken, clearSessionCookie } from '@/lib/auth/cookies';
import { authProvider } from '@/lib/auth/jwt-provider';

export async function POST() {
  try {
    const token = await getSessionToken();

    if (token) {
      // Revoke the session from database
      await authProvider.revokeSession(token);
    }

    // Clear the cookie
    await clearSessionCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '予期しないエラーが発生しました',
      },
      { status: 500 }
    );
  }
}
