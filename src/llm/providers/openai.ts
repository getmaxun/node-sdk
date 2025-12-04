import OpenAI from 'openai';
import { BaseLLMProvider } from './base';
import { LLMMessage, LLMResponse, LLMConfig } from '../types';

/**
 * OpenAI provider for GPT models
 */
export class OpenAIProvider extends BaseLLMProvider {
  private client: OpenAI;

  constructor(config: LLMConfig) {
    super(config);
    
    this.client = new OpenAI({
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      baseURL: config.baseUrl // Allows custom endpoints
    });
  }

  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model || 'gpt-4o-mini',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: this.config.temperature || 0.7,
        max_tokens: this.config.maxTokens || 4096
      });

      const choice = response.choices[0];
      
      return {
        content: choice.message.content || '',
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        }
      };
    } catch (error: any) {
      throw new Error(`OpenAI API error: ${error.message || error}`);
    }
  }

  validateConfig(): void {
    if (!this.config.apiKey && !process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key required. Set OPENAI_API_KEY environment variable or provide apiKey in config.');
    }
    
    if (!this.config.model) {
      console.warn('OpenAI model not specified, using default: gpt-4o-mini');
    }
  }

  getProviderName(): string {
    return 'OpenAI';
  }
}
