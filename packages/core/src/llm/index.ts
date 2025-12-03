import { BaseLLMProvider } from './providers/base';
import { OllamaProvider } from './providers/ollama';
import { AnthropicProvider } from './providers/anthropic';
import { OpenAIProvider } from './providers/openai';
import { LLMConfig } from './types';

/**
 * Factory function to create LLM provider instances
 */
export function createLLMProvider(config: LLMConfig): BaseLLMProvider {
  switch (config.provider) {
    case 'ollama':
      return new OllamaProvider(config);
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'openai':
      return new OpenAIProvider(config);
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }
}

// Re-export types and base class
export { BaseLLMProvider } from './providers/base';
export { OllamaProvider } from './providers/ollama';
export { AnthropicProvider } from './providers/anthropic';
export { OpenAIProvider } from './providers/openai';
export type { LLMConfig, LLMMessage, LLMResponse, LLMProvider } from './types';
