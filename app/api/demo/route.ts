import { NextRequest, NextResponse } from 'next/server';
import { ConverseCommand, type Message as ConverseMessage } from '@aws-sdk/client-bedrock-runtime';
import { getBedrockClient, getModelConfig } from '@/lib/bedrock';
import { buildSystemPrompt } from '@/lib/systemPrompt';
import { buildProSalesmanPrompt } from '@/lib/salesPrompt';
import type { ChatSettings } from '@/lib/types';

interface DemoRequest {
  settings: ChatSettings;
  turns: number; // 会話のターン数（1ターン = 営業→見込み客）
}

interface ConversationTurn {
  salesman: string;
  prospect: string;
}

async function callBedrock(
  messages: ConverseMessage[],
  systemPrompt: string
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
      throw new Error('Invalid response format from Bedrock');
    }

    const textContent = contents.find((c) => 'text' in c);

    if (!textContent || !('text' in textContent) || !textContent.text) {
      throw new Error('No text content in Bedrock response');
    }

    return { text: textContent.text, success: true };
  } catch (error: any) {
    const errorMessage = `通信エラー: ${error.message || '不明なエラー'}`;
    return { text: '', success: false, error: errorMessage };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: DemoRequest = await request.json();
    const { settings, turns } = body;

    if (!settings || !turns || turns < 1 || turns > 10) {
      return NextResponse.json(
        { success: false, error: '無効なリクエストです（ターン数は1-10）' },
        { status: 400 }
      );
    }

    console.log('\n========== デモ会話生成 ==========');
    console.log(`ターン数: ${turns}`);
    console.log(`設定: ${settings.age}歳 ${settings.gender === 'male' ? '男性' : '女性'} ${settings.maritalStatus}`);

    const salesmanPrompt = buildProSalesmanPrompt(settings);
    const prospectPrompt = buildSystemPrompt(settings);

    const conversation: ConversationTurn[] = [];
    let salesmanMessages: ConverseMessage[] = [];
    let prospectMessages: ConverseMessage[] = [];

    for (let i = 0; i < turns; i++) {
      console.log(`\n--- ターン ${i + 1} ---`);

      // 営業マンの発言を生成
      const salesmanResult = await callBedrock(salesmanMessages, salesmanPrompt);

      if (!salesmanResult.success) {
        return NextResponse.json(
          { success: false, error: salesmanResult.error },
          { status: 500 }
        );
      }

      console.log(`営業: ${salesmanResult.text}`);

      // 営業マンの発言を履歴に追加
      salesmanMessages.push({
        role: 'assistant',
        content: [{ text: salesmanResult.text }],
      });

      // 見込み客の履歴に営業マンの発言を追加（userとして）
      prospectMessages.push({
        role: 'user',
        content: [{ text: salesmanResult.text }],
      });

      // 見込み客の発言を生成
      const prospectResult = await callBedrock(prospectMessages, prospectPrompt);

      if (!prospectResult.success) {
        return NextResponse.json(
          { success: false, error: prospectResult.error },
          { status: 500 }
        );
      }

      console.log(`見込み客: ${prospectResult.text}`);

      // 見込み客の発言を履歴に追加
      prospectMessages.push({
        role: 'assistant',
        content: [{ text: prospectResult.text }],
      });

      // 営業マンの履歴に見込み客の発言を追加（userとして）
      salesmanMessages.push({
        role: 'user',
        content: [{ text: prospectResult.text }],
      });

      // 会話ターンを保存
      conversation.push({
        salesman: salesmanResult.text,
        prospect: prospectResult.text,
      });
    }

    console.log('\n==============================\n');

    return NextResponse.json({
      success: true,
      conversation,
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
