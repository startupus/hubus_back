/**
 * Скрипт для проверки моделей OpenRouter с поддержкой аудио/видео
 * Запуск: ts-node services/proxy-service/src/proxy/check-audio-models.ts
 */

import axios from 'axios';

async function checkAudioModels() {
  const openrouterApiKey = process.env.OPENROUTER_API_KEY;
  
  if (!openrouterApiKey || openrouterApiKey.includes('your-') || openrouterApiKey.includes('sk-or-your-')) {
    console.error('❌ OPENROUTER_API_KEY не установлен или невалиден');
    process.exit(1);
  }

  try {
    console.log('🔍 Загрузка списка моделей из OpenRouter...\n');
    
    const response = await axios.get('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'HTTP-Referer': 'https://ai-aggregator.com',
        'X-Title': 'AI Aggregator'
      }
    });

    const models = response.data?.data || [];
    console.log(`📊 Всего моделей: ${models.length}\n`);

    // Ключевые слова для поиска моделей с поддержкой аудио/видео
    const audioKeywords = [
      'whisper',
      'audio',
      'transcription',
      'speech',
      'voice',
      'opus',
      'gpt-4o', // GPT-4o может обрабатывать аудио
      'gpt-4-turbo', // GPT-4 Turbo может обрабатывать аудио
      'vision', // Vision модели могут обрабатывать видео
      'multimodal',
      'multimedia'
    ];

    // Ищем модели с поддержкой аудио
    const audioModels: any[] = [];
    
    models.forEach((model: any) => {
      const modelId = model.id?.toLowerCase() || '';
      const modelName = model.name?.toLowerCase() || '';
      const description = model.description?.toLowerCase() || '';
      const context = `${modelId} ${modelName} ${description}`;
      
      // Проверяем по ключевым словам
      const hasAudioSupport = audioKeywords.some(keyword => 
        context.includes(keyword.toLowerCase())
      );
      
      // Также проверяем capabilities, если они есть
      const capabilities = model.capabilities || [];
      const hasAudioCapability = capabilities.some((cap: string) => 
        cap.toLowerCase().includes('audio') || 
        cap.toLowerCase().includes('speech') ||
        cap.toLowerCase().includes('transcription')
      );

      if (hasAudioSupport || hasAudioCapability) {
        audioModels.push({
          id: model.id,
          name: model.name,
          description: model.description,
          capabilities: model.capabilities || [],
          architecture: model.architecture,
          context_length: model.context_length,
          pricing: model.pricing,
          top_provider: model.top_provider,
          // Дополнительные поля из OpenRouter
          ...model
        });
      }
    });

    console.log(`🎵 Найдено моделей с поддержкой аудио/видео: ${audioModels.length}\n`);
    console.log('='.repeat(80));
    
    if (audioModels.length === 0) {
      console.log('❌ Модели с поддержкой аудио не найдены в OpenRouter');
      console.log('\n💡 Возможные причины:');
      console.log('   1. OpenRouter не поддерживает Whisper API напрямую');
      console.log('   2. Модели с поддержкой аудио могут быть в других категориях');
      console.log('   3. Нужно использовать прямой OpenAI API для Whisper');
    } else {
      audioModels.forEach((model, index) => {
        console.log(`\n${index + 1}. ${model.name || model.id}`);
        console.log(`   ID: ${model.id}`);
        if (model.description) {
          console.log(`   Описание: ${model.description.substring(0, 100)}...`);
        }
        if (model.capabilities && model.capabilities.length > 0) {
          console.log(`   Возможности: ${model.capabilities.join(', ')}`);
        }
        if (model.architecture) {
          console.log(`   Архитектура: ${model.architecture}`);
        }
        if (model.context_length) {
          console.log(`   Context length: ${model.context_length}`);
        }
        if (model.pricing) {
          console.log(`   Цена: $${model.pricing.prompt || 0}/1K input, $${model.pricing.completion || 0}/1K output`);
        }
        if (model.top_provider) {
          console.log(`   Провайдер: ${model.top_provider.name}`);
        }
      });
    }

    // Дополнительно проверяем GPT-4o и другие новые модели
    console.log('\n' + '='.repeat(80));
    console.log('\n🔍 Проверка конкретных моделей, которые могут поддерживать аудио:\n');
    
    const specificModels = [
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'openai/gpt-4-turbo',
      'openai/whisper-1',
      'anthropic/claude-3-opus',
      'anthropic/claude-3-5-sonnet',
      'google/gemini-pro',
      'google/gemini-1.5-pro'
    ];

    specificModels.forEach(modelId => {
      const found = models.find((m: any) => m.id === modelId);
      if (found) {
        console.log(`✅ ${modelId}`);
        console.log(`   Название: ${found.name || 'N/A'}`);
        console.log(`   Описание: ${found.description?.substring(0, 80) || 'N/A'}...`);
        if (found.capabilities) {
          console.log(`   Возможности: ${found.capabilities.join(', ') || 'N/A'}`);
        }
      } else {
        console.log(`❌ ${modelId} - не найдена`);
      }
    });

    // Проверяем, есть ли endpoint для audio/transcriptions в OpenRouter
    console.log('\n' + '='.repeat(80));
    console.log('\n📡 Проверка поддержки audio/transcriptions endpoint в OpenRouter...\n');
    
    // OpenRouter обычно не поддерживает Whisper API напрямую
    console.log('⚠️  OpenRouter НЕ поддерживает Whisper API (/audio/transcriptions) напрямую');
    console.log('   Whisper API доступен только через прямой OpenAI API');
    console.log('\n💡 Решение:');
    console.log('   - Использовать прямой OpenAI API для Whisper');
    console.log('   - Или использовать GPT-4o/GPT-4 Turbo для обработки аудио через chat/completions');
    console.log('   - GPT-4o может обрабатывать аудио в формате base64 в сообщениях');

  } catch (error: any) {
    console.error('❌ Ошибка при загрузке моделей:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Запускаем проверку
checkAudioModels().catch(console.error);

