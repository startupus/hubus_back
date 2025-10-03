const http = require('http');
const https = require('https');

// Конфигурация сервисов
const services = {
  'auth-service': { port: 3001, basePath: '' },
  'api-gateway': { port: 3000, basePath: '' },
  'billing-service': { port: 3004, basePath: '' },
  'provider-orchestrator': { port: 3002, basePath: '' },
  'proxy-service': { port: 3003, basePath: '' },
  'analytics-service': { port: 3005, basePath: '' },
};

// Функция для выполнения HTTP запроса
function makeRequest(host, port, path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'HTTP-Test-Client/1.0',
      },
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Тесты для каждого сервиса
async function testServices() {
  console.log('🔍 Тестирование HTTP сервисов...\n');

  // 1. Auth Service
  console.log('1️⃣ Тестируем Auth Service (порт 3001)...');
  try {
    const authHealth = await makeRequest('localhost', 3001, '/health');
    console.log('   ✅ Health Check:', authHealth.statusCode, authHealth.data);
  } catch (error) {
    console.log('   ❌ Auth Service Health:', error.message);
  }

  try {
    const authRegister = await makeRequest('localhost', 3001, '/auth/register', 'POST', {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    });
    console.log('   ✅ Register:', authRegister.statusCode, authRegister.data);
  } catch (error) {
    console.log('   ❌ Auth Service Register:', error.message);
  }

  // 2. API Gateway
  console.log('\n2️⃣ Тестируем API Gateway (порт 3000)...');
  try {
    const gatewayHealth = await makeRequest('localhost', 3000, '/health/live');
    console.log('   ✅ Health Check:', gatewayHealth.statusCode, gatewayHealth.data);
  } catch (error) {
    console.log('   ❌ API Gateway Health:', error.message);
  }

  // 3. Billing Service
  console.log('\n3️⃣ Тестируем Billing Service (порт 3004)...');
  try {
    const billingBalance = await makeRequest('localhost', 3004, '/billing/balance/test-user');
    console.log('   ✅ Get Balance:', billingBalance.statusCode, billingBalance.data);
  } catch (error) {
    console.log('   ❌ Billing Service Balance:', error.message);
  }

  try {
    const billingTransaction = await makeRequest('localhost', 3004, '/billing/transactions', 'POST', {
      user_id: 'test-user',
      type: 'debit',
      amount: 10.50,
      description: 'Test transaction'
    });
    console.log('   ✅ Create Transaction:', billingTransaction.statusCode, billingTransaction.data);
  } catch (error) {
    console.log('   ❌ Billing Service Transaction:', error.message);
  }

  // 4. Provider Orchestrator
  console.log('\n4️⃣ Тестируем Provider Orchestrator (порт 3002)...');
  try {
    const orchestratorRoute = await makeRequest('localhost', 3002, '/orchestrator/route-request', 'POST', {
      userId: 'test-user',
      model: 'gpt-4',
      prompt: 'Hello, world!'
    });
    console.log('   ✅ Route Request:', orchestratorRoute.statusCode, orchestratorRoute.data);
  } catch (error) {
    console.log('   ❌ Provider Orchestrator Route:', error.message);
  }

  try {
    const orchestratorStatus = await makeRequest('localhost', 3002, '/orchestrator/provider-status/openai');
    console.log('   ✅ Provider Status:', orchestratorStatus.statusCode, orchestratorStatus.data);
  } catch (error) {
    console.log('   ❌ Provider Orchestrator Status:', error.message);
  }

  // 5. Proxy Service
  console.log('\n5️⃣ Тестируем Proxy Service (порт 3003)...');
  try {
    const proxyRequest = await makeRequest('localhost', 3003, '/proxy/request', 'POST', {
      user_id: 'test-user',
      provider: 'openai',
      model: 'gpt-4',
      prompt: 'Hello, world!'
    });
    console.log('   ✅ Proxy Request:', proxyRequest.statusCode, proxyRequest.data);
  } catch (error) {
    console.log('   ❌ Proxy Service Request:', error.message);
  }

  try {
    const proxyModels = await makeRequest('localhost', 3003, '/proxy/models');
    console.log('   ✅ Get Models:', proxyModels.statusCode, proxyModels.data);
  } catch (error) {
    console.log('   ❌ Proxy Service Models:', error.message);
  }

  // 6. Analytics Service
  console.log('\n6️⃣ Тестируем Analytics Service (порт 3005)...');
  try {
    const analyticsTrack = await makeRequest('localhost', 3005, '/analytics/track-event', 'POST', {
      userId: 'test-user',
      eventName: 'test-event',
      properties: { key: 'value' }
    });
    console.log('   ✅ Track Event:', analyticsTrack.statusCode, analyticsTrack.data);
  } catch (error) {
    console.log('   ❌ Analytics Service Track:', error.message);
  }

  try {
    const analyticsMetrics = await makeRequest('localhost', 3005, '/analytics/usage-metrics/test-user');
    console.log('   ✅ Usage Metrics:', analyticsMetrics.statusCode, analyticsMetrics.data);
  } catch (error) {
    console.log('   ❌ Analytics Service Metrics:', error.message);
  }

  console.log('\n🏁 HTTP тестирование завершено!');
}

// Запускаем тесты
testServices().catch(console.error);
