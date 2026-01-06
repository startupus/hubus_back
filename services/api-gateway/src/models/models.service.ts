import { Injectable, Logger } from '@nestjs/common';
import { LoggerUtil } from '@ai-aggregator/shared';
import { ChatService } from '../chat/chat.service';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  category: string;
  description: string;
  maxTokens: number;
  inputCost: number;
  outputCost: number;
  isAvailable: boolean;
  capabilities: string[];
  contextWindow: number;
  trainingData: string;
  lastUpdated: string;
}

export interface ModelProvider {
  id: string;
  name: string;
  description: string;
  website: string;
  isActive: boolean;
  supportedCategories: string[];
}

export interface ModelCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

@Injectable()
export class ModelsService {
  private readonly logger = new Logger(ModelsService.name);
  
  constructor(private readonly chatService: ChatService) {}

  // Mock data for AI models
  private readonly models: AIModel[] = [
    // OpenAI Models
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'openai',
      category: 'chat',
      description: 'Most advanced GPT-4 model with vision capabilities',
      maxTokens: 128000,
      inputCost: 0.005,
      outputCost: 0.015,
      isAvailable: true,
      capabilities: ['text', 'vision', 'function_calling'],
      contextWindow: 128000,
      trainingData: 'Up to Oct 2023',
      lastUpdated: '2024-05-13'
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      provider: 'openai',
      category: 'chat',
      description: 'Faster, cheaper GPT-4o model',
      maxTokens: 128000,
      inputCost: 0.00015,
      outputCost: 0.0006,
      isAvailable: true,
      capabilities: ['text', 'vision', 'function_calling'],
      contextWindow: 128000,
      trainingData: 'Up to Oct 2023',
      lastUpdated: '2024-07-18'
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'openai',
      category: 'chat',
      description: 'Fast and efficient model for most tasks',
      maxTokens: 16385,
      inputCost: 0.0005,
      outputCost: 0.0015,
      isAvailable: true,
      capabilities: ['text', 'function_calling'],
      contextWindow: 16385,
      trainingData: 'Up to Sep 2021',
      lastUpdated: '2024-06-20'
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'openai',
      category: 'chat',
      description: 'Most capable GPT-4 model with 128k context',
      maxTokens: 128000,
      inputCost: 0.01,
      outputCost: 0.03,
      isAvailable: true,
      capabilities: ['text', 'vision', 'function_calling'],
      contextWindow: 128000,
      trainingData: 'Up to Apr 2024',
      lastUpdated: '2024-04-09'
    },

    // Anthropic Models
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      provider: 'anthropic',
      category: 'chat',
      description: 'Most intelligent Claude model with 200k context',
      maxTokens: 200000,
      inputCost: 0.003,
      outputCost: 0.015,
      isAvailable: true,
      capabilities: ['text', 'vision', 'function_calling'],
      contextWindow: 200000,
      trainingData: 'Up to Apr 2024',
      lastUpdated: '2024-10-22'
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      provider: 'anthropic',
      category: 'chat',
      description: 'Fast and efficient Claude model',
      maxTokens: 200000,
      inputCost: 0.00025,
      outputCost: 0.00125,
      isAvailable: true,
      capabilities: ['text', 'vision', 'function_calling'],
      contextWindow: 200000,
      trainingData: 'Up to Apr 2024',
      lastUpdated: '2024-10-22'
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      provider: 'anthropic',
      category: 'chat',
      description: 'Most powerful Claude 3 model',
      maxTokens: 200000,
      inputCost: 0.015,
      outputCost: 0.075,
      isAvailable: true,
      capabilities: ['text', 'vision', 'function_calling'],
      contextWindow: 200000,
      trainingData: 'Up to Aug 2023',
      lastUpdated: '2024-02-29'
    },

    // Google Models
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      provider: 'google',
      category: 'chat',
      description: 'Google\'s most capable model with 2M context',
      maxTokens: 2000000,
      inputCost: 0.00125,
      outputCost: 0.005,
      isAvailable: true,
      capabilities: ['text', 'vision', 'function_calling'],
      contextWindow: 2000000,
      trainingData: 'Up to Feb 2024',
      lastUpdated: '2024-02-15'
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      provider: 'google',
      category: 'chat',
      description: 'Fast and efficient Gemini model',
      maxTokens: 1000000,
      inputCost: 0.000075,
      outputCost: 0.0003,
      isAvailable: true,
      capabilities: ['text', 'vision', 'function_calling'],
      contextWindow: 1000000,
      trainingData: 'Up to Feb 2024',
      lastUpdated: '2024-02-15'
    },

    // Russian Models
    {
      id: 'yandexgpt',
      name: 'YandexGPT',
      provider: 'yandex',
      category: 'chat',
      description: 'Yandex\'s flagship language model',
      maxTokens: 8000,
      inputCost: 0.0001,
      outputCost: 0.0001,
      isAvailable: true,
      capabilities: ['text'],
      contextWindow: 8000,
      trainingData: 'Up to 2023',
      lastUpdated: '2024-01-01'
    },
    {
      id: 'gigachat',
      name: 'GigaChat',
      provider: 'sber',
      category: 'chat',
      description: 'Sber\'s Russian language model',
      maxTokens: 32000,
      inputCost: 0.0001,
      outputCost: 0.0001,
      isAvailable: true,
      capabilities: ['text'],
      contextWindow: 32000,
      trainingData: 'Up to 2023',
      lastUpdated: '2024-01-01'
    },

    // Specialized Models
    {
      id: 'dall-e-3',
      name: 'DALL-E 3',
      provider: 'openai',
      category: 'image',
      description: 'Advanced image generation model',
      maxTokens: 0,
      inputCost: 0.04,
      outputCost: 0,
      isAvailable: true,
      capabilities: ['image_generation'],
      contextWindow: 0,
      trainingData: 'Up to Apr 2024',
      lastUpdated: '2024-04-09'
    },
    {
      id: 'whisper-1',
      name: 'Whisper',
      provider: 'openai',
      category: 'audio',
      description: 'Speech recognition model',
      maxTokens: 0,
      inputCost: 0.006,
      outputCost: 0,
      isAvailable: true,
      capabilities: ['speech_to_text'],
      contextWindow: 0,
      trainingData: 'Up to Sep 2021',
      lastUpdated: '2022-09-21'
    },
    {
      id: 'text-embedding-3-large',
      name: 'Text Embedding 3 Large',
      provider: 'openai',
      category: 'embedding',
      description: 'High-quality text embeddings',
      maxTokens: 8191,
      inputCost: 0.00013,
      outputCost: 0,
      isAvailable: true,
      capabilities: ['text_embedding'],
      contextWindow: 8191,
      trainingData: 'Up to Sep 2021',
      lastUpdated: '2024-01-25'
    }
  ];

  private readonly providers: ModelProvider[] = [
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'Leading AI research company',
      website: 'https://openai.com',
      isActive: true,
      supportedCategories: ['chat', 'image', 'audio', 'embedding']
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      description: 'AI safety company',
      website: 'https://anthropic.com',
      isActive: true,
      supportedCategories: ['chat']
    },
    {
      id: 'google',
      name: 'Google',
      description: 'Google AI models',
      website: 'https://ai.google',
      isActive: true,
      supportedCategories: ['chat']
    },
    {
      id: 'yandex',
      name: 'Yandex',
      description: 'Russian technology company',
      website: 'https://yandex.ru',
      isActive: true,
      supportedCategories: ['chat']
    },
    {
      id: 'sber',
      name: 'Sber',
      description: 'Russian banking and technology company',
      website: 'https://sber.ru',
      isActive: true,
      supportedCategories: ['chat']
    }
  ];

  private readonly categories: ModelCategory[] = [
    {
      id: 'chat',
      name: 'Chat',
      description: 'Conversational AI models',
      icon: '💬'
    },
    {
      id: 'image',
      name: 'Image Generation',
      description: 'AI models for creating images',
      icon: '🎨'
    },
    {
      id: 'audio',
      name: 'Audio Processing',
      description: 'AI models for audio tasks',
      icon: '🎵'
    },
    {
      id: 'embedding',
      name: 'Embeddings',
      description: 'AI models for text embeddings',
      icon: '🔗'
    }
  ];

  async getModels(provider?: string, category?: string): Promise<{
    success: boolean;
    message: string;
    models: AIModel[];
    providers: ModelProvider[];
    categories: ModelCategory[];
    total: number;
    filters: {
      provider?: string;
      category?: string;
    };
  }> {
    try {
      LoggerUtil.debug('api-gateway', 'Getting AI models', { provider, category });

      // Получаем модели из proxy-service через OpenRouter API
      let openRouterModels: any[] = [];
      try {
        openRouterModels = await this.chatService.getModels('openrouter');
        LoggerUtil.info('api-gateway', 'Models loaded from OpenRouter API', {
          count: openRouterModels.length
        });
      } catch (error) {
        LoggerUtil.warn('api-gateway', 'Failed to load models from OpenRouter, using fallback', {
          error: error instanceof Error ? error.message : String(error)
        });
        // Fallback на жестко закодированный список, если API недоступен
        openRouterModels = [];
      }

      // Преобразуем модели из OpenRouter в формат AIModel
      const convertedModels: AIModel[] = openRouterModels.map((model: any) => ({
        id: model.id,
        name: model.name || model.id,
        provider: this.extractProviderFromId(model.id) || 'openrouter',
        category: model.category || 'chat',
        description: model.description || `Model ${model.id} via OpenRouter`,
        maxTokens: model.max_tokens || 8192,
        inputCost: model.cost_per_input_token || 0,
        outputCost: model.cost_per_output_token || 0,
        isAvailable: model.is_available !== false,
        capabilities: model.capabilities || ['chat', 'completion'],
        contextWindow: model.max_tokens || 8192,
        trainingData: 'Via OpenRouter',
        lastUpdated: model.updated_at || new Date().toISOString()
      }));

      // Если модели из API не загрузились, используем fallback
      let filteredModels = convertedModels.length > 0 ? convertedModels : [...this.models];

      // Apply filters
      if (provider) {
        filteredModels = filteredModels.filter(model => model.provider === provider);
      }

      if (category) {
        filteredModels = filteredModels.filter(model => model.category === category);
      }

      // Only return available models
      filteredModels = filteredModels.filter(model => model.isAvailable);

      LoggerUtil.info('api-gateway', 'AI models retrieved successfully', {
        total: filteredModels.length,
        fromOpenRouter: convertedModels.length,
        provider,
        category
      });

      return {
        success: true,
        message: 'AI models retrieved successfully',
        models: filteredModels,
        providers: this.providers.filter(p => p.isActive),
        categories: this.categories,
        total: filteredModels.length,
        filters: {
          provider,
          category
        }
      };
    } catch (error) {
      LoggerUtil.error('api-gateway', 'Failed to get AI models', error as Error, { provider, category });
      throw error;
    }
  }

  /**
   * Извлекает название провайдера из ID модели OpenRouter
   * Например: "openai/gpt-4o" -> "openai"
   */
  private extractProviderFromId(modelId: string): string {
    if (modelId.includes('/')) {
      return modelId.split('/')[0];
    }
    // Маппинг известных провайдеров
    if (modelId.includes('gpt')) return 'openai';
    if (modelId.includes('claude')) return 'anthropic';
    if (modelId.includes('gemini')) return 'google';
    if (modelId.includes('llama')) return 'meta';
    return 'openrouter';
  }

  async getProviders(): Promise<{
    success: boolean;
    message: string;
    providers: ModelProvider[];
  }> {
    try {
      LoggerUtil.debug('api-gateway', 'Getting AI model providers');

      const activeProviders = this.providers.filter(p => p.isActive);

      LoggerUtil.info('api-gateway', 'AI model providers retrieved successfully', {
        total: activeProviders.length
      });

      return {
        success: true,
        message: 'AI model providers retrieved successfully',
        providers: activeProviders
      };
    } catch (error) {
      LoggerUtil.error('api-gateway', 'Failed to get AI model providers', error as Error);
      throw error;
    }
  }

  async getCategories(): Promise<{
    success: boolean;
    message: string;
    categories: ModelCategory[];
  }> {
    try {
      LoggerUtil.debug('api-gateway', 'Getting AI model categories');

      LoggerUtil.info('api-gateway', 'AI model categories retrieved successfully', {
        total: this.categories.length
      });

      return {
        success: true,
        message: 'AI model categories retrieved successfully',
        categories: this.categories
      };
    } catch (error) {
      LoggerUtil.error('api-gateway', 'Failed to get AI model categories', error as Error);
      throw error;
    }
  }
}
