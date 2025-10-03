const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Загружаем proto файлы
const authProto = protoLoader.loadSync('services/auth-service/proto/auth.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const billingProto = protoLoader.loadSync('services/billing-service/proto/billing.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const orchestratorProto = protoLoader.loadSync('services/provider-orchestrator/proto/orchestrator.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const proxyProto = protoLoader.loadSync('services/proxy-service/proto/proxy.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

// Создаем определения сервисов
const authService = grpc.loadPackageDefinition(authProto).auth;
const billingService = grpc.loadPackageDefinition(billingProto).billing;
const orchestratorService = grpc.loadPackageDefinition(orchestratorProto).orchestrator;
const proxyService = grpc.loadPackageDefinition(proxyProto).proxy;

// Создаем клиенты
const authClient = new authService.AuthService('localhost:50051', grpc.credentials.createInsecure());
const billingClient = new billingService.BillingService('localhost:50052', grpc.credentials.createInsecure());
const orchestratorClient = new orchestratorService.ProviderOrchestratorService('localhost:50054', grpc.credentials.createInsecure());
const proxyClient = new proxyService.ProxyService('localhost:50055', grpc.credentials.createInsecure());

console.log('🔍 Тестирование gRPC сервисов...\n');

// Тест 1: Auth Service
console.log('1️⃣ Тестируем Auth Service (порт 50051)...');
authClient.GetUser({ email: 'test@example.com' }, (error, response) => {
  if (error) {
    console.log('   ❌ Auth Service:', error.message);
  } else {
    console.log('   ✅ Auth Service:', response);
  }
});

// Тест 2: Billing Service
console.log('2️⃣ Тестируем Billing Service (порт 50052)...');
billingClient.GetBalance({ user_id: 'test-user' }, (error, response) => {
  if (error) {
    console.log('   ❌ Billing Service:', error.message);
  } else {
    console.log('   ✅ Billing Service:', response);
  }
});

// Тест 3: Provider Orchestrator
console.log('3️⃣ Тестируем Provider Orchestrator (порт 50054)...');
orchestratorClient.GetProviderStatus({ provider_id: 'openai' }, (error, response) => {
  if (error) {
    console.log('   ❌ Provider Orchestrator:', error.message);
  } else {
    console.log('   ✅ Provider Orchestrator:', response);
  }
});

// Тест 4: Proxy Service
console.log('4️⃣ Тестируем Proxy Service (порт 50055)...');
proxyClient.ProxyRequest({ user_id: 'test-user', provider: 'openai', model: 'gpt-4', prompt: 'Hello' }, (error, response) => {
  if (error) {
    console.log('   ❌ Proxy Service:', error.message);
  } else {
    console.log('   ✅ Proxy Service:', response);
  }
});

// Ждем завершения всех тестов
setTimeout(() => {
  console.log('\n🏁 Тестирование завершено!');
  process.exit(0);
}, 3000);
