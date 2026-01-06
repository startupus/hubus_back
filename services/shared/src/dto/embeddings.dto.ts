import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Embeddings Request DTO
 */
export class EmbeddingsRequest {
  @ApiProperty({ 
    description: 'ID модели для генерации эмбеддингов',
    example: 'openai/text-embedding-ada-002'
  })
  @IsString()
  @IsNotEmpty()
  model!: string;

  @ApiProperty({ 
    description: 'Текст или массив текстов для генерации эмбеддингов',
    example: 'Текст для генерации эмбеддинга',
    oneOf: [
      { type: 'string' },
      { type: 'array', items: { type: 'string' } }
    ]
  })
  @IsNotEmpty()
  input!: string | string[];

  @ApiProperty({ 
    description: 'Идентификатор пользователя (опционально)',
    required: false
  })
  @IsOptional()
  @IsString()
  user?: string;
}

/**
 * Embedding Data DTO
 */
export class EmbeddingData {
  @ApiProperty({ description: 'Тип объекта' })
  object!: string;

  @ApiProperty({ 
    description: 'Массив чисел - векторное представление текста',
    type: [Number],
    example: [0.0023064255, -0.009327292, 0.0012345678]
  })
  @IsArray()
  embedding!: number[];

  @ApiProperty({ description: 'Индекс в массиве' })
  index!: number;
}

/**
 * Embeddings Response DTO
 */
export class EmbeddingsResponse {
  @ApiProperty({ description: 'Тип объекта' })
  object!: string;

  @ApiProperty({ 
    description: 'Массив эмбеддингов',
    type: [EmbeddingData]
  })
  @IsArray()
  data!: EmbeddingData[];

  @ApiProperty({ description: 'Модель, использованная для генерации' })
  model!: string;

  @ApiProperty({ description: 'Использование токенов' })
  usage!: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

