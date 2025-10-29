export type Gender = 'male' | 'female';
export type MaritalStatus = 'single' | 'married' | 'divorced';
export type InsuranceProduct = 'cancer' | 'medical' | 'life' | 'nursing' | 'education' | 'pension';

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

export interface DemoSettings {
  prospectName: string;
  age: number;
  gender: Gender;
  maritalStatus: MaritalStatus;
  insuranceProduct: InsuranceProduct;
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
