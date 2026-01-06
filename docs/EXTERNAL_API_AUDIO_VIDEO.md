# Инструкция: Отправка аудио и видео через External API

## 📋 Обзор

External API (`POST /api/v1/chat/completions`) поддерживает передачу аудио и видео файлов в нейросети через OpenRouter. Файлы должны быть закодированы в base64 и переданы в правильном формате согласно документации OpenRouter.

## 🎵 Формат для аудио

### Структура запроса

```json
{
  "model": "mistralai/voxtral-small-24b-2507",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Транскрибируй это аудио на русском языке"
        },
        {
          "type": "input_audio",
          "input_audio": {
            "data": "[base64_encoded_audio_data]",
            "format": "mp3"
          }
        }
      ]
    }
  ]
}
```

### Важные детали:

1. **Тип контента**: `type: "input_audio"` (обязательно)
2. **Данные**: `input_audio.data` - base64 строка **БЕЗ** префикса `data:audio/...;base64,`
3. **Формат**: `input_audio.format` - формат файла: `wav`, `mp3`, `aiff`, `aac`, `ogg`, `flac`, `m4a`, `pcm16`, `pcm24`

### Поддерживаемые форматы аудио:
- `wav`
- `mp3`
- `aiff`
- `aac`
- `ogg`
- `flac`
- `m4a`
- `pcm16`
- `pcm24`

## 🎬 Формат для видео

### Структура запроса

```json
{
  "model": "openai/gpt-4o",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Опиши что происходит в этом видео"
        },
        {
          "type": "video_url",
          "video_url": {
            "url": "data:video/mp4;base64,YOUR_BASE64_ENCODED_VIDEO_STRING"
          }
        }
      ]
    }
  ]
}
```

### Важные детали:

1. **Тип контента**: `type: "video_url"` (обязательно)
2. **URL**: `video_url.url` - base64 data URL **С** префиксом `data:video/mp4;base64,...`

## 📝 Примеры использования

### Пример 1: Аудио транскрипция (Python)

```python
import requests
import base64

# API настройки
api_key = "ak_your_api_key_here"
base_url = "http://localhost:3000/api/v1"

# Читаем и кодируем аудио файл
with open("audio.mp3", "rb") as audio_file:
    audio_data = base64.b64encode(audio_file.read()).decode('utf-8')

# Формируем запрос
request_data = {
    "model": "mistralai/voxtral-small-24b-2507",
    "messages": [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Транскрибируй это аудио на русском языке"
                },
                {
                    "type": "input_audio",
                    "input_audio": {
                        "data": audio_data,  # base64 без префикса
                        "format": "mp3"
                    }
                }
            ]
        }
    ]
}

# Отправляем запрос
response = requests.post(
    f"{base_url}/chat/completions",
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    },
    json=request_data,
    timeout=300
)

result = response.json()
print(result["choices"][0]["message"]["content"])
```

### Пример 2: Видео анализ (Python)

```python
import requests
import base64

# API настройки
api_key = "ak_your_api_key_here"
base_url = "http://localhost:3000/api/v1"

# Читаем и кодируем видео файл
with open("video.mp4", "rb") as video_file:
    video_data = base64.b64encode(video_file.read()).decode('utf-8')
    video_data_url = f"data:video/mp4;base64,{video_data}"  # С префиксом

# Формируем запрос
request_data = {
    "model": "openai/gpt-4o",
    "messages": [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Опиши что происходит в этом видео"
                },
                {
                    "type": "video_url",
                    "video_url": {
                        "url": video_data_url  # base64 data URL с префиксом
                    }
                }
            ]
        }
    ]
}

# Отправляем запрос
response = requests.post(
    f"{base_url}/chat/completions",
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    },
    json=request_data,
    timeout=600
)

result = response.json()
print(result["choices"][0]["message"]["content"])
```

### Пример 3: Аудио транскрипция (JavaScript/Node.js)

```javascript
const fs = require('fs');
const axios = require('axios');

// API настройки
const apiKey = 'ak_your_api_key_here';
const baseUrl = 'http://localhost:3000/api/v1';

// Читаем и кодируем аудио файл
const audioBuffer = fs.readFileSync('audio.mp3');
const audioData = audioBuffer.toString('base64'); // base64 без префикса

// Формируем запрос
const requestData = {
  model: 'mistralai/voxtral-small-24b-2507',
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Транскрибируй это аудио на русском языке'
        },
        {
          type: 'input_audio',
          input_audio: {
            data: audioData,  // base64 без префикса
            format: 'mp3'
          }
        }
      ]
    }
  ]
};

// Отправляем запрос
axios.post(
  `${baseUrl}/chat/completions`,
  requestData,
  {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: 300000 // 5 минут
  }
)
.then(response => {
  console.log(response.data.choices[0].message.content);
})
.catch(error => {
  console.error('Error:', error.response?.data || error.message);
});
```

### Пример 4: Видео анализ (JavaScript/Node.js)

```javascript
const fs = require('fs');
const axios = require('axios');

// API настройки
const apiKey = 'ak_your_api_key_here';
const baseUrl = 'http://localhost:3000/api/v1';

// Читаем и кодируем видео файл
const videoBuffer = fs.readFileSync('video.mp4');
const videoData = videoBuffer.toString('base64');
const videoDataUrl = `data:video/mp4;base64,${videoData}`; // С префиксом

// Формируем запрос
const requestData = {
  model: 'openai/gpt-4o',
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Опиши что происходит в этом видео'
        },
        {
          type: 'video_url',
          video_url: {
            url: videoDataUrl  // base64 data URL с префиксом
          }
        }
      ]
    }
  ]
};

// Отправляем запрос
axios.post(
  `${baseUrl}/chat/completions`,
  requestData,
  {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: 600000 // 10 минут
  }
)
.then(response => {
  console.log(response.data.choices[0].message.content);
})
.catch(error => {
  console.error('Error:', error.response?.data || error.message);
});
```

### Пример 5: cURL для аудио

```bash
# Кодируем аудио файл в base64
AUDIO_BASE64=$(base64 -i audio.mp3)

# Отправляем запрос
curl -X POST "http://localhost:3000/api/v1/chat/completions" \
  -H "Authorization: Bearer ak_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"mistralai/voxtral-small-24b-2507\",
    \"messages\": [
      {
        \"role\": \"user\",
        \"content\": [
          {
            \"type\": \"text\",
            \"text\": \"Транскрибируй это аудио на русском языке\"
          },
          {
            \"type\": \"input_audio\",
            \"input_audio\": {
              \"data\": \"$AUDIO_BASE64\",
              \"format\": \"mp3\"
            }
          }
        ]
      }
    ]
  }"
```

## 🔍 Модели с поддержкой аудио/видео

### Аудио:
- `mistralai/voxtral-small-24b-2507` ⭐ Рекомендуется для транскрипции
- `openai/gpt-4o-audio-preview` - для анализа аудио
- `openai/gpt-4o` - также поддерживает видео
- `google/gemini-2.5-flash` - универсальная модель

### Видео:
- `openai/gpt-4o` ⭐ Рекомендуется для видео анализа
- `google/gemini-2.5-flash` - быстрая обработка
- `google/gemini-3-flash-preview` - новая версия
- `google/gemini-3-pro-preview` - более точная версия

## ⚠️ Важные ограничения

1. **Размер файлов**:
   - Base64 увеличивает размер файла примерно на 33%
   - **Максимальный размер файла: 50MB** (настроено в системе)
   - Рекомендуется использовать файлы до 50MB для аудио
   - Для видео рекомендуется до 50MB (зависит от модели и лимитов OpenRouter)

2. **Таймауты**:
   - Аудио: до 5 минут обработки
   - Видео: до 10 минут обработки
   - Установите соответствующий timeout в вашем клиенте

3. **Формат данных**:
   - **Аудио**: base64 **БЕЗ** префикса `data:audio/...;base64,`
   - **Видео**: base64 **С** префиксом `data:video/mp4;base64,...`

4. **Типы контента**:
   - Аудио: `type: "input_audio"` (не `"audio"`)
   - Видео: `type: "video_url"` (не `"video"`)

## 📊 Формат ответа

```json
{
  "id": "chatcmpl-xxxxxxxxxxxxx",
  "object": "chat.completion",
  "created": 1702800000,
  "model": "mistralai/voxtral-small-24b-2507",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Транскрибированный текст или описание видео..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 50,
    "total_tokens": 200
  },
  "provider": "openrouter",
  "processing_time_ms": 2500
}
```

## 🚀 Быстрый старт

1. Получите API ключ (формат: `ak_...`)
2. Закодируйте файл в base64
3. Сформируйте запрос согласно формату выше
4. Отправьте POST запрос на `/api/v1/chat/completions`
5. Получите текстовое описание в `choices[0].message.content`

## 🔗 Связанные документы

- [OpenRouter Audio Documentation](https://openrouter.ai/docs/features/multimodal/audio)
- [OpenRouter Video Documentation](https://openrouter.ai/docs/guides/overview/multimodal/videos)
- [API Examples](./API_EXAMPLES.md)

