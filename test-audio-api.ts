/**
 * Скрипт для тестирования отправки аудио через External API
 * Запуск: npx ts-node test-audio-api.ts
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const API_KEY = 'ak_f8102e585cef62a1c4b990cfd1c55d3ccec91dcc2982fdfdc5b0e350699cc847';
const BASE_URL = 'http://localhost:3000/api/v1';
const MODEL = 'mistralai/voxtral-small-24b-2507';

/**
 * Создает минимальный валидный WAV файл для тестирования
 */
function createTestWavFile(): Buffer {
  // Минимальный валидный WAV файл (44 байта)
  const wavHeader = Buffer.from([
    0x52, 0x49, 0x46, 0x46,  // "RIFF"
    0x24, 0x00, 0x00, 0x00,  // размер файла - 8
    0x57, 0x41, 0x56, 0x45,  // "WAVE"
    0x66, 0x6D, 0x74, 0x20,  // "fmt "
    0x10, 0x00, 0x00, 0x00,  // размер fmt chunk
    0x01, 0x00,              // аудио формат (PCM)
    0x01, 0x00,              // количество каналов (моно)
    0x44, 0xAC, 0x00, 0x00,  // sample rate (44100)
    0x88, 0x58, 0x01, 0x00,  // byte rate
    0x02, 0x00,              // block align
    0x10, 0x00,              // bits per sample
    0x64, 0x61, 0x74, 0x61,  // "data"
    0x00, 0x00, 0x00, 0x00   // размер данных
  ]);
  
  return wavHeader;
}

/**
 * Читает аудио файл и конвертирует в base64
 */
function readAudioFile(filePath: string): string {
  try {
    const audioBuffer = fs.readFileSync(filePath);
    return audioBuffer.toString('base64');
  } catch (error) {
    console.error(`❌ Ошибка при чтении файла ${filePath}:`, error);
    throw error;
  }
}

/**
 * Определяет формат файла по расширению
 */
function getAudioFormat(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase().substring(1);
  const formatMap: Record<string, string> = {
    'wav': 'wav',
    'mp3': 'mp3',
    'm4a': 'm4a',
    'aac': 'aac',
    'ogg': 'ogg',
    'flac': 'flac',
    'aiff': 'aiff'
  };
  
  return formatMap[ext] || 'wav';
}

/**
 * Отправляет аудио запрос к API
 */
async function sendAudioRequest(audioBase64: string, format: string, prompt?: string): Promise<any> {
  const requestBody = {
    model: MODEL,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt || 'Транскрибируй это аудио на русском языке. Это тестовый файл.'
          },
          {
            type: 'input_audio',
            input_audio: {
              data: audioBase64,
              format: format
            }
          }
        ]
      }
    ]
  };

  try {
    const response = await axios.post(
      `${BASE_URL}/chat/completions`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 300000 // 5 минут
      }
    );

    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        `HTTP ${error.response.status}: ${JSON.stringify(error.response.data, null, 2)}`
      );
    }
    throw error;
  }
}

/**
 * Главная функция
 */
async function main() {
  console.log('🎵 Тестирование отправки аудио через External API\n');
  console.log(`🔐 API Key: ${API_KEY.substring(0, 20)}...`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`🤖 Model: ${MODEL}\n`);

  let audioBase64: string;
  let format: string;
  let audioSize: number;

  // Проверяем, есть ли аргумент с путем к файлу
  const audioFilePath = process.argv[2];

  if (audioFilePath && fs.existsSync(audioFilePath)) {
    console.log(`📁 Используется файл: ${audioFilePath}`);
    audioBase64 = readAudioFile(audioFilePath);
    format = getAudioFormat(audioFilePath);
    audioSize = fs.statSync(audioFilePath).size;
    console.log(`   ⚠️  Используется реальный аудио файл`);
  } else {
    console.log('📦 Создание тестового WAV файла...');
    console.log('   ⚠️  Внимание: это минимальный WAV файл без реальных аудио данных');
    console.log('   💡 Для теста с реальным аудио: npx ts-node test-audio-api.ts path/to/audio.mp3\n');
    const testWav = createTestWavFile();
    audioBase64 = testWav.toString('base64');
    format = 'wav';
    audioSize = testWav.length;
  }

  console.log(`   Format: ${format.toUpperCase()}`);
  console.log(`   Size: ${audioSize} bytes`);
  console.log(`   Base64 length: ${audioBase64.length} characters\n`);

  console.log('📤 Отправка запроса...\n');

  try {
    const startTime = Date.now();
    const response = await sendAudioRequest(audioBase64, format);
    const processingTime = Date.now() - startTime;

    console.log('✅ Запрос успешно выполнен!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Ответ от нейросети:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (response.choices && response.choices.length > 0) {
      const content = response.choices[0].message.content;
      console.log(content);
    } else {
      console.log(JSON.stringify(response, null, 2));
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 Статистика:');

    if (response.usage) {
      console.log(`   Prompt tokens: ${response.usage.prompt_tokens}`);
      console.log(`   Completion tokens: ${response.usage.completion_tokens}`);
      console.log(`   Total tokens: ${response.usage.total_tokens}`);
    }

    if (response.processing_time_ms) {
      console.log(`   Processing time: ${response.processing_time_ms} ms`);
    } else {
      console.log(`   Processing time: ${processingTime} ms`);
    }

    console.log(`   Model: ${response.model || MODEL}`);
    console.log(`   Provider: ${response.provider || 'openrouter'}\n`);

    console.log('🎉 Тест завершен успешно!\n');

  } catch (error: any) {
    console.error('❌ Ошибка при отправке запроса:\n');
    console.error('   ', error.message);

    if (error.response) {
      console.error('\n   Response data:', JSON.stringify(error.response.data, null, 2));
    }

    console.error('\n💡 Проверьте:');
    console.error('   1. Запущены ли контейнеры (docker-compose ps)');
    console.error('   2. Правильный ли API ключ');
    console.error('   3. Доступен ли OpenRouter API ключ в .env');
    console.error('   4. Логи сервисов: docker-compose logs api-gateway proxy-service\n');

    process.exit(1);
  }
}

// Запуск
main().catch(console.error);

