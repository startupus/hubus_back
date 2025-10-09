# 🏢 Иерархическая система компаний - Быстрый старт

## 🚀 Мгновенный запуск (4 команды)

```powershell
# 1. Применить миграции БД
.\apply-hierarchy-migrations.ps1

# 2. Пересобрать обновленные сервисы
docker-compose build --no-cache auth-service billing-service api-gateway

# 3. Перезапустить сервисы
docker-compose up -d auth-service billing-service api-gateway

# 4. Протестировать систему
.\test-hierarchical-system.ps1
```

---

## 📖 Что это?

**Новая архитектура:** Больше нет разделения на Users и Companies. Теперь **каждый пользователь = компания**.

### Ключевые особенности

✅ **Иерархия:** Компании могут иметь дочерние компании (любая глубина)  
✅ **Flexible billing:** Каждая компания выбирает кто платит за её запросы:
   - `SELF_PAID` - платит сама
   - `PARENT_PAID` - платит родительская компания

✅ **Каскадное списание:** Только на 1 уровень вверх (не сквозное)

---

## 🎯 Примеры использования

### Пример 1: Корпорация с отделами

```
TechCorp (root, SELF_PAID, баланс: $10,000)
  ├─ Sales Dept (PARENT_PAID, баланс: $0)
  ├─ Engineering (PARENT_PAID, баланс: $0)
  └─ Marketing (SELF_PAID, баланс: $2,000)
```

**Биллинг:**
- Sales делает AI-запрос → списывается с **TechCorp**
- Engineering делает запрос → списывается с **TechCorp**
- Marketing делает запрос → списывается с **Marketing**

### Пример 2: Агентство с клиентами

```
Agency (root, SELF_PAID)
  ├─ Client A (PARENT_PAID) → агентство платит за клиента
  └─ Client B (SELF_PAID) → клиент платит сам
```

---

## 🔑 Основные API

### Регистрация root-компании

```bash
POST http://localhost:3001/companies/register
Content-Type: application/json

{
  "name": "My Company",
  "email": "company@example.com",
  "password": "SecurePass123!"
}
```

**Ответ:** JWT токен для дальнейшей работы

### Создание дочерней компании

```bash
POST http://localhost:3001/companies/{parentId}/child-companies
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Child Company",
  "email": "child@example.com",
  "password": "ChildPass123!",
  "billingMode": "PARENT_PAID",
  "position": "Manager",
  "department": "Sales"
}
```

### Получение иерархии

```bash
GET http://localhost:3001/companies/{companyId}/hierarchy?depth=3
Authorization: Bearer {token}
```

### AI-запрос (автоматический биллинг)

```bash
POST http://localhost:3000/v1/chat/completions?provider=openai
Authorization: Bearer {token}
Content-Type: application/json

{
  "model": "gpt-4o-mini",
  "messages": [
    {"role": "user", "content": "Hello, AI!"}
  ]
}
```

**Система автоматически:**
1. Определяет кто делает запрос (из JWT)
2. Проверяет его `billingMode`
3. Списывает с правильного плательщика (самого или родителя)
4. Сохраняет информацию об инициаторе

---

## 📊 Как работает каскадное списание

### Правило: **Списание ТОЛЬКО на 1 уровень вверх**

```
Company A (root)
  └─ Company B (PARENT_PAID)
       └─ Company C (PARENT_PAID)
```

| Кто делает запрос | Кто платит | Почему |
|-------------------|------------|--------|
| Company A | Company A | SELF_PAID (root) |
| Company B | Company A | PARENT_PAID → родитель = A |
| Company C | Company B | PARENT_PAID → родитель = B (**не A!**) |

### Важно!

❌ **НЕ сквозное списание:** Company C не списывает напрямую с Company A  
✅ **Только родитель:** Company C списывает только с Company B

---

## 🛠️ Изменение режима биллинга

```bash
PUT http://localhost:3001/companies/{companyId}/billing-mode
Authorization: Bearer {token}
Content-Type: application/json

{
  "billingMode": "SELF_PAID"  # или "PARENT_PAID"
}
```

Компания может в любой момент изменить свой режим оплаты.

---

## 📈 Статистика

### Получить статистику дочерних компаний

```bash
GET http://localhost:3004/billing/company/{companyId}/users/statistics
```

**Ответ:**
```json
{
  "totals": {
    "totalChildCompanies": 3,
    "totalRequests": 150,
    "totalCost": 45.50
  },
  "childCompanies": [
    {
      "company": {
        "name": "Sales Dept",
        "billingMode": "PARENT_PAID"
      },
      "statistics": {
        "totalRequests": 50,
        "totalCost": 15.20,
        "byService": {
          "openai": {"count": 30, "cost": 10.00},
          "openrouter": {"count": 20, "cost": 5.20}
        }
      }
    }
  ]
}
```

---

## 🧪 Тестирование

### Автоматический тест

```powershell
.\test-hierarchical-system.ps1
```

Тест автоматически:
1. Создает root-компанию
2. Создает дочерние компании с разными режимами
3. Делает AI-запросы
4. Проверяет правильность списания
5. Выводит детальный отчет

### Ручной тест (PowerShell)

```powershell
# 1. Регистрация
$registerBody = @{
    name = "Test Company"
    email = "test-$(Get-Date -Format 'HHmmss')@example.com"
    password = "TestPass123!"
} | ConvertTo-Json

$registerResponse = Invoke-RestMethod -Uri "http://localhost:3001/companies/register" `
    -Method POST -Body $registerBody -ContentType "application/json"

$token = $registerResponse.accessToken
$companyId = $registerResponse.company.id

Write-Host "Company created: $companyId"
Write-Host "Token: $token"

# 2. Проверить баланс
$balance = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$companyId/balance" -Method GET

Write-Host "Balance: $($balance.balance.balance)"

# 3. Сделать AI-запрос
$aiRequest = @{
    model = "gpt-4o-mini"
    messages = @(
        @{role = "user"; content = "Test request"}
    )
} | ConvertTo-Json -Depth 10

$aiResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/chat/completions?provider=openai" `
    -Method POST -Body $aiRequest -ContentType "application/json" `
    -Headers @{Authorization = "Bearer $token"}

Write-Host "AI Response: $($aiResponse.choices[0].message.content)"

# 4. Проверить баланс после запроса
Start-Sleep -Seconds 2
$newBalance = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$companyId/balance" -Method GET

Write-Host "New balance: $($newBalance.balance.balance)"
Write-Host "Cost: $($balance.balance.balance - $newBalance.balance.balance)"
```

---

## 📁 Структура проекта

```
project/
├── services/
│   ├── auth-service/         # Обновлен: иерархия компаний
│   ├── billing-service/      # Обновлен: каскадное списание
│   ├── api-gateway/          # Обновлен: новые endpoints
│   └── ...
├── migrations/
│   ├── 001_add_company_hierarchy_auth.sql
│   └── 002_add_company_hierarchy_billing.sql
├── apply-hierarchy-migrations.ps1    # Скрипт миграции
├── test-hierarchical-system.ps1      # Комплексный тест
├── HIERARCHICAL_SYSTEM_IMPLEMENTATION.md   # Полная документация
├── DEPLOYMENT_GUIDE_HIERARCHICAL.md        # Руководство по развертыванию
└── FINAL_SUMMARY.md                        # Итоговый отчет
```

---

## 🔧 Troubleshooting

### Проблема: "Column does not exist"

```bash
# Применить миграции заново
.\apply-hierarchy-migrations.ps1
```

### Проблема: TypeScript ошибки

```powershell
# Регенерировать Prisma клиенты
cd services/auth-service
npx prisma generate

cd ../billing-service
npx prisma generate

# Пересобрать сервисы
cd ../..
docker-compose build --no-cache auth-service billing-service
```

### Проблема: Сервис не запускается

```powershell
# Проверить логи
docker-compose logs auth-service
docker-compose logs billing-service

# Перезапустить
docker-compose restart auth-service billing-service
```

---

## 📚 Документация

Полная документация доступна в файлах:

1. **HIERARCHICAL_SYSTEM_IMPLEMENTATION.md** - детальное описание
2. **DEPLOYMENT_GUIDE_HIERARCHICAL.md** - развертывание
3. **FINAL_SUMMARY.md** - краткий отчет
4. **IMPLEMENTATION_COMPLETE_REPORT.md** - полный отчет о выполнении

---

## ✅ Контрольный список

Перед началом работы убедитесь:

- [x] Docker Desktop запущен
- [x] Порты 3000-3005 свободны
- [ ] Миграции применены (`.\apply-hierarchy-migrations.ps1`)
- [ ] Сервисы пересобраны (`docker-compose build`)
- [ ] Сервисы запущены (`docker-compose up -d`)
- [ ] Система протестирована (`.\test-hierarchical-system.ps1`)

---

## 🎉 Готово!

Система полностью готова к использованию. Начните с регистрации первой компании:

```powershell
curl -X POST http://localhost:3001/companies/register `
  -H "Content-Type: application/json" `
  -d '{"name":"My Company","email":"company@example.com","password":"SecurePass123!"}'
```

**Успехов! 🚀**

