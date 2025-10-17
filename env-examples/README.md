# Environment Variables Examples

Этот каталог содержит примеры файлов конфигурации для всех сервисов.

## Настройка

1. Скопируйте соответствующий `.env.example` файл в папку сервиса как `.env`
2. Замените все placeholder значения на реальные
3. Убедитесь, что `.env` файлы добавлены в `.gitignore`

## Файлы конфигурации

- `api-gateway.env.example` - API Gateway
- `auth-service.env.example` - Auth Service  
- `billing-service.env.example` - Billing Service
- `proxy-service.env.example` - Proxy Service
- `provider-orchestrator.env.example` - Provider Orchestrator
- `analytics-service.env.example` - Analytics Service
- `ai-certification-service.env.example` - AI Certification Service

## Важные замечания

⚠️ **НЕ КОММИТЬТЕ РЕАЛЬНЫЕ .env ФАЙЛЫ В GIT!**

Все конфиденциальные данные (API ключи, пароли, токены) должны быть заменены на placeholder значения.
