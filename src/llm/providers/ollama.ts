import { Ollama } from 'ollama';
import { BaseLLMProvider } from './base';
import { LLMMessage, LLMResponse, LLMConfig } from '../types';

/**
 * Ollama provider for local LLM inference
 * Supports Llama, Mistral, and other open-source models
 */
export class OllamaProvider extends BaseLLMProvider {
  private client: Ollama;

  constructor(config: LLMConfig) {
    super(config);
    
    this.client = new Ollama({
      host: config.baseUrl || process.env.OLLAMA_HOST || 'http://localhost:11434'
    });
  }

  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    try {
      const response = await this.client.chat({
        model: this.config.model || 'llama3.1',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        options: {
          temperature: this.config.temperature || 0.7,
          num_predict: this.config.maxTokens || 2048
        }
      });

      return {
        content: response.message.content,
        usage: {
          promptTokens: response.prompt_eval_count || 0,
          completionTokens: response.eval_count || 0,
          totalTokens: (response.prompt_eval_count || 0) + (response.eval_count || 0)
        }
      };
    } catch (error: any) {
      throw new Error(`Ollama API error: ${error.message || error}`);
    }
  }

  validateConfig(): void {
    if (!this.config.baseUrl && !process.env.OLLAMA_HOST) {
      console.warn('Ollama baseUrl not provided, using default: http://localhost:11434');
    }
    
    if (!this.config.model) {
      console.warn('Ollama model not specified, using default: llama3.1');
    }
  }

  getProviderName(): string {
    return 'Ollama';
  }
}
