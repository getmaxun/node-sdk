import Anthropic from '@anthropic-ai/sdk';
import { BaseLLMProvider } from './base';
import { LLMMessage, LLMResponse, LLMConfig } from '../types';

/**
 * Anthropic provider for Claude models
 */
export class AnthropicProvider extends BaseLLMProvider {
  private client: Anthropic;

  constructor(config: LLMConfig) {
    super(config);
    
    this.client = new Anthropic({
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY
    });
  }

  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    try {
      // Anthropic requires system message separately
      const systemMessage = messages.find(m => m.role === 'system');
      const userMessages = messages.filter(m => m.role !== 'system');

      const response = await this.client.messages.create({
        model: this.config.model || 'claude-3-5-sonnet-20241022',
        max_tokens: this.config.maxTokens || 4096,
        temperature: this.config.temperature || 0.7,
        system: systemMessage?.content,
        messages: userMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      });

      const textContent = response.content.find((c: any) => c.type === 'text');
      
      return {
        content: textContent?.type === 'text' ? textContent.text : '',
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens
        }
      };
    } catch (error: any) {
      throw new Error(`Anthropic API error: ${error.message || error}`);
    }
  }

  validateConfig(): void {
    if (!this.config.apiKey && !process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key required. Set ANTHROPIC_API_KEY environment variable or provide apiKey in config.');
    }
    
    if (!this.config.model) {
      console.warn('Anthropic model not specified, using default: claude-3-5-sonnet-20241022');
    }
  }

  getProviderName(): string {
    return 'Anthropic';
  }
}
