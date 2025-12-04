/**
 * LLM Provider Configuration
 */

export type LLMProvider = 'anthropic' | 'openai' | 'ollama';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string;        // For cloud providers (Anthropic, OpenAI)
  baseUrl?: string;       // For custom endpoints (Ollama, custom OpenAI)
  model?: string;         // Model name
  temperature?: number;   // 0-1, creativity level
  maxTokens?: number;     // Max response tokens
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
