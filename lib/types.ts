export type Gender = 'male' | 'female';
export type MaritalStatus = 'single' | 'married' | 'divorced';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatSettings {
  age: number;
  gender: Gender;
  maritalStatus: MaritalStatus;
}

export interface ChatRequest {
  messages: Message[];
  settings: ChatSettings;
}

export interface ChatResponse {
  success: boolean;
  message?: string;
  error?: string;
  warning?: string;
}
