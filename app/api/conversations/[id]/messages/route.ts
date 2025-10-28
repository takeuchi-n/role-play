import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { getCurrentUser } from '@/lib/auth/session';

interface AddMessageRequest {
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokenIn?: number;
  tokenOut?: number;
}

/**
 * POST /api/conversations/:id/messages
 * Add a message to a conversation
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentUser();

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body: AddMessageRequest = await request.json();
    const { role, content, tokenIn = 0, tokenOut = 0 } = body;

    // Validation
    if (!role || !content) {
      return NextResponse.json(
        { success: false, error: 'role と content は必須です' },
        { status: 400 }
      );
    }

    if (!['user', 'assistant', 'system'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'role は user, assistant, system のいずれかである必要があります' },
        { status: 400 }
      );
    }

    // Verify ownership
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: session.userId,
      },
      include: {
        messages: {
          orderBy: {
            index: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Calculate next index
    const nextIndex = conversation.messages.length > 0 ? conversation.messages[0].index + 1 : 0;

    // Create message and update conversation in a transaction
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: id,
          role,
          content,
          tokenIn,
          tokenOut,
          index: nextIndex,
        },
      }),
      prisma.conversation.update({
        where: { id },
        data: {
          messageCount: {
            increment: 1,
          },
          updatedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: {
        ...message,
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Add message error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '予期しないエラーが発生しました',
      },
      { status: 500 }
    );
  }
}
