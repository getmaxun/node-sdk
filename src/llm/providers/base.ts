import { LLMConfig, LLMMessage, LLMResponse } from '../types';

/**
 * Abstract base class for LLM providers
 * Provides common interface for Anthropic, OpenAI, and Ollama
 */
export abstract class BaseLLMProvider {
  protected config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * Send chat messages to LLM and get response
   */
  abstract chat(messages: LLMMessage[]): Promise<LLMResponse>;

  /**
   * Validate provider-specific configuration
   */
  abstract validateConfig(): void;

  /**
   * Get the provider name
   */
  abstract getProviderName(): string;

  /**
   * Helper to create system message
   */
  protected createSystemMessage(content: string): LLMMessage {
    return { role: 'system', content };
  }

  /**
   * Helper to create user message
   */
  protected createUserMessage(content: string): LLMMessage {
    return { role: 'user', content };
  }
}
