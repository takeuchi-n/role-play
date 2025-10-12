import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

let client: BedrockRuntimeClient | null = null;

export function getBedrockClient(): BedrockRuntimeClient {
  if (!client) {
    const region = process.env.AWS_REGION;

    if (!region) {
      throw new Error('AWS_REGION environment variable is not set');
    }

    client = new BedrockRuntimeClient({
      region,
    });
  }

  return client;
}

export function getModelConfig() {
  return {
    modelId: process.env.BEDROCK_MODEL_ID || 'openai.gpt-oss-20b-1:0',
    maxTokens: Number(process.env.BEDROCK_MAX_TOKENS ?? 512),
    temperature: Number(process.env.BEDROCK_TEMPERATURE ?? 0.4),
  };
}
