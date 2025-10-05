import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { LoggerUtil } from '@ai-aggregator/shared';

@Injectable()
export class ProxyService {
  async proxyOpenAI(requestData: any) {
    try {
      LoggerUtil.debug('api-gateway', 'Proxying OpenAI request', { requestData });

      // Mock response for now
      return {
        id: 'chatcmpl-' + Date.now(),
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: requestData.model || 'gpt-3.5-turbo',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Hello! I am a mock AI response. This is a test response from the API Gateway.'
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        }
      };
    } catch (error) {
      LoggerUtil.error('api-gateway', 'Failed to proxy OpenAI request', error as Error);
      throw new HttpException(
        'Failed to proxy OpenAI request',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async proxyOpenRouter(requestData: any) {
    try {
      LoggerUtil.debug('api-gateway', 'Proxying OpenRouter request', { requestData });

      // Mock response for now
      return {
        id: 'chatcmpl-' + Date.now(),
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: requestData.model || 'gpt-3.5-turbo',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Hello! I am a mock AI response from OpenRouter. This is a test response from the API Gateway.'
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        }
      };
    } catch (error) {
      LoggerUtil.error('api-gateway', 'Failed to proxy OpenRouter request', error as Error);
      throw new HttpException(
        'Failed to proxy OpenRouter request',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async validateRequest(requestData: any) {
    try {
      LoggerUtil.debug('api-gateway', 'Validating request', { requestData });

      // Basic validation
      if (!requestData.messages || !Array.isArray(requestData.messages)) {
        return {
          valid: false,
          message: 'Messages array is required',
          errors: ['messages must be an array']
        };
      }

      if (requestData.messages.length === 0) {
        return {
          valid: false,
          message: 'At least one message is required',
          errors: ['messages array cannot be empty']
        };
      }

      return {
        valid: true,
        message: 'Request is valid',
        validatedFields: {
          messages: requestData.messages.length,
          model: requestData.model || 'gpt-3.5-turbo',
          temperature: requestData.temperature || 0.7
        }
      };
    } catch (error) {
      LoggerUtil.error('api-gateway', 'Failed to validate request', error as Error);
      throw new HttpException(
        'Failed to validate request',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
