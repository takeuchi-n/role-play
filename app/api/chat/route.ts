import { NextRequest, NextResponse } from 'next/server';
import { ConverseCommand, type Message as ConverseMessage } from '@aws-sdk/client-bedrock-runtime';
import { getBedrockClient, getModelConfig } from '@/lib/bedrock';
import { buildSystemPrompt, buildRetrySystemPrompt } from '@/lib/systemPrompt';
import { validateResponse } from '@/lib/guard';
import type { ChatRequest } from '@/lib/types';

function convertToConverseMessages(messages: ChatRequest['messages']): ConverseMessage[] {
  return messages.map((msg) => ({
    role: msg.role,
    content: [{ text: msg.content }],
  }));
}

async function callBedrock(
  messages: ConverseMessage[],
  systemPrompt: string,
  retryCount = 0
): Promise<{ text: string; success: boolean; error?: string }> {
  const client = getBedrockClient();
  const config = getModelConfig();

  try {
    const command = new ConverseCommand({
      modelId: config.modelId,
      system: [{ text: systemPrompt }],
      messages,
      inferenceConfig: {
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        topP: 0.9,
      },
    });

    const response = await client.send(command);

    const contents = response.output?.message?.content;

    if (!contents || contents.length === 0) {
      console.error('Bedrock response:', JSON.stringify(response, null, 2));
      throw new Error('Invalid response format from Bedrock');
    }

    // Find the text content (skip reasoningContent)
    const textContent = contents.find((c) => 'text' in c);

    if (!textContent || !('text' in textContent) || !textContent.text) {
      console.error('Bedrock response:', JSON.stringify(response, null, 2));

      // If no text content, check if it's due to safety/policy rejection
      if (response.stopReason === 'max_tokens' || response.stopReason === 'content_filtered') {
        return {
          text: '',
          success: false,
          error: '応答を生成できませんでした。入力内容を確認してください。',
        };
      }

      throw new Error('No text content in Bedrock response');
    }

    return { text: textContent.text, success: true };
  } catch (error: any) {
    // Rate limit or server error - retry once with exponential backoff
    if (
      retryCount === 0 &&
      (error.name === 'ThrottlingException' ||
        error.$metadata?.httpStatusCode >= 500)
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return callBedrock(messages, systemPrompt, retryCount + 1);
    }

    const errorMessage =
      error.name === 'ThrottlingException'
        ? 'レート制限に達しました。しばらくしてから再試行してください。'
        : error.$metadata?.httpStatusCode >= 500
        ? 'サーバーエラーが発生しました。しばらくしてから再試行してください。'
        : `通信エラー: ${error.message || '不明なエラー'}`;

    return { text: '', success: false, error: errorMessage };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, settings } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'メッセージが必要です' },
        { status: 400 }
      );
    }

    // ログ出力：会話履歴
    console.log('\n========== 会話ログ ==========');
    console.log(`会話ターン数: ${messages.length}`);
    console.log(`設定: ${settings.age}歳 ${settings.gender === 'male' ? '男性' : '女性'} ${settings.maritalStatus}`);
    console.log('\n【会話履歴】');
    messages.forEach((msg, idx) => {
      const role = msg.role === 'user' ? '営業' : '見込み客';
      console.log(`[${idx + 1}] ${role}: ${msg.content}`);
    });
    console.log('==============================\n');

    const systemPrompt = buildSystemPrompt({
      age: settings.age,
      gender: settings.gender,
      maritalStatus: settings.maritalStatus,
    });

    const converseMessages = convertToConverseMessages(messages);

    // First attempt
    const result = await callBedrock(converseMessages, systemPrompt);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Validate response
    const validation = validateResponse(result.text);

    if (!validation.valid) {
      // Retry once with stricter system prompt
      const retrySystemPrompt = buildRetrySystemPrompt({
        age: settings.age,
        gender: settings.gender,
        maritalStatus: settings.maritalStatus,
      });

      const retryResult = await callBedrock(converseMessages, retrySystemPrompt);

      if (!retryResult.success) {
        return NextResponse.json(
          { success: false, error: retryResult.error },
          { status: 500 }
        );
      }

      const retryValidation = validateResponse(retryResult.text);

      if (!retryValidation.valid) {
        // Still invalid after retry
        console.log('【警告】');
        console.log(validation.warning);
        console.log('\n==============================\n');

        return NextResponse.json({
          success: true,
          warning: validation.warning,
        });
      }

      // Retry succeeded
      console.log('【AI応答（リトライ成功）】');
      console.log(retryResult.text);
      console.log('\n==============================\n');

      return NextResponse.json({
        success: true,
        message: retryResult.text,
      });
    }

    // First attempt succeeded
    console.log('【AI応答】');
    console.log(result.text);
    console.log('\n==============================\n');

    return NextResponse.json({
      success: true,
      message: result.text,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '予期しないエラーが発生しました',
      },
      { status: 500 }
    );
  }
}
