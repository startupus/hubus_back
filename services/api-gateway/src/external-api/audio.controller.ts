import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, Body, Request, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiHeader, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ApiKeyAuthGuard } from '../auth/api-key-auth.guard';
import { LoggerUtil } from '@ai-aggregator/shared';

/**
 * Audio Transcription Controller for /v1/audio/transcriptions
 * This endpoint is at /v1/ (not /api/v1/) to match OpenAI format
 */
@ApiTags('External API - Audio')
@Controller('v1/audio')
@ApiSecurity('ApiKeyAuth')
@ApiHeader({
  name: 'Authorization',
  description: 'API Key in format: Bearer ak_[A-Za-z0-9]{40} (e.g., Bearer ak_AbCdEf1234567890...)',
  required: true,
})
export class AudioController {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Create audio transcription (External API)
   * POST /v1/audio/transcriptions
   */
  @Post('transcriptions')
  @UseGuards(ApiKeyAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50 MB
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ 
    summary: 'Create audio transcription (External API)',
    description: 'Transcribes audio or video file. Requires API key in Authorization header. Uses multipart/form-data.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Audio or video file to transcribe'
        },
        model: {
          type: 'string',
          default: 'whisper-1',
          description: 'Model to use for transcription'
        },
        language: {
          type: 'string',
          description: 'Language code (e.g., ru, en)'
        },
        prompt: {
          type: 'string',
          description: 'Optional prompt to improve accuracy'
        },
        temperature: {
          type: 'number',
          description: 'Temperature (0.0 - 1.0)'
        },
        response_format: {
          type: 'string',
          enum: ['json', 'text', 'srt', 'verbose_json', 'vtt'],
          default: 'verbose_json',
          description: 'Response format'
        }
      },
      required: ['file', 'model']
    }
  })
  @ApiResponse({ status: 200, description: 'Audio transcribed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or missing API key' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async createTranscription(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Request() req: any,
  ): Promise<any> {
    const startTime = Date.now();
    const companyId = req.user?.companyId;
    const provider = 'openrouter';

    if (!file) {
      throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
    }

    const request = {
      model: body.model || 'whisper-1',
      language: body.language,
      prompt: body.prompt,
      temperature: body.temperature ? parseFloat(body.temperature) : undefined,
      response_format: body.response_format || 'verbose_json'
    };

    LoggerUtil.info('api-gateway', 'External API audio transcription request', {
      companyId,
      provider,
      model: request.model,
      fileSize: file.size
    });

    try {
      const proxyServiceUrl = this.configService.get('PROXY_SERVICE_URL', 'http://proxy-service:3003');
      
      // Создаем FormData для передачи файла
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const FormData = require('form-data');
      const formData = new FormData();
      
      formData.append('file', file.buffer, {
        filename: file.originalname || 'audio.mp3',
        contentType: file.mimetype || 'audio/mpeg'
      });
      
      formData.append('model', request.model);
      if (request.language) formData.append('language', request.language);
      if (request.prompt) formData.append('prompt', request.prompt);
      if (request.temperature !== undefined) formData.append('temperature', request.temperature.toString());
      if (request.response_format) formData.append('response_format', request.response_format);

      const response = await firstValueFrom(
        this.httpService.post(
          `${proxyServiceUrl}/proxy/audio/transcriptions?user_id=${companyId || 'external-api'}&provider=${provider}`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              'Authorization': req.headers.authorization // Передаем API key для proxy-service
            },
            timeout: 300000 // 5 минут
          }
        )
      );

      const responseTime = Date.now() - startTime;

      LoggerUtil.info('api-gateway', 'External API audio transcription completed', {
        companyId,
        provider,
        responseTime
      });

      return response.data;
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'External API audio transcription failed', error, {
        companyId,
        provider
      });

      if (error.response?.status) {
        throw new HttpException(
          error.response.data?.message || 'Proxy service error',
          error.response.status
        );
      }

      throw new HttpException(
        error.message || 'Failed to create audio transcription',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

