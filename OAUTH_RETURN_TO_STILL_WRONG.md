# Проблема: return_to все еще неправильный

## Проверка через браузер

После клика на "Вход/Регистрация" и проверки URL:

```
"returnTo": "/oauth/authorize"
```

**Проблема:** Backend все еще сохраняет `return_to=/oauth/authorize` вместо `/api/oauth/authorize`

## Что происходит

1. Запрос на `/api/oauth/authorize?client_id=...&redirect_uri=...&state=...`
2. Backend редиректит на: `index.html?oauth_flow=true&return_to=/oauth/authorize`
3. ❌ `return_to=/oauth/authorize` (без `/api/`)
4. Frontend редиректит на `/oauth/authorize` (без `/api/`)
5. Показывается форма входа или dashboard вместо обработки backend

## Что должно быть

1. Запрос на `/api/oauth/authorize?client_id=...&redirect_uri=...&state=...`
2. Backend редиректит на: `index.html?oauth_flow=true&return_to=/api/oauth/authorize`
3. ✅ `return_to=/api/oauth/authorize` (с `/api/`)
4. Frontend редиректит на `/api/oauth/authorize` (с `/api/`)
5. Backend обрабатывает запрос и создает authorization code

## Проверка кода backend

Убедитесь, что в `oauth.controller.ts` при редиректе на логин используется:

```typescript
// ✅ ПРАВИЛЬНО
const returnTo = '/api/oauth/authorize';

// ❌ НЕПРАВИЛЬНО
const returnTo = '/oauth/authorize';
```

## Возможные причины

1. **Изменения не применены на сервере** - нужно перезапустить backend
2. **Кэш браузера** - очистить кэш или использовать инкогнито
3. **Изменения применены не полностью** - проверить все места, где используется `return_to`

## Решение

1. Проверить код backend - убедиться, что везде используется `/api/oauth/authorize`
2. Перезапустить backend сервис
3. Очистить кэш браузера
4. Проверить снова

## Резюме

**Проблема:** Backend все еще сохраняет `return_to=/oauth/authorize` вместо `/api/oauth/authorize`

**Решение:** Проверить и исправить код backend, перезапустить сервис

**Статус:** Требуется проверка и исправление в Loginus backend

