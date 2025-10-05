# Deployment Guide

## 🎯 Обзор

Это руководство описывает процесс развертывания AI Aggregator в различных средах: development, staging и production.

## 🏗️ Архитектура развертывания

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │────│   API Gateway   │────│  Microservices  │
│   (Nginx)       │    │   (Port: 3000)  │    │   (Ports: 3001-3005) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐               │
         └──────────────│   Database      │───────────────┘
                        │   (PostgreSQL)  │
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │   Cache         │
                        │   (Redis)       │
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │   Message Queue │
                        │   (RabbitMQ)    │
                        └─────────────────┘
```

## 🚀 Development

### Предварительные требования
- Docker & Docker Compose
- Node.js 18+
- Git

### Быстрый старт
```bash
# Клонирование репозитория
git clone https://github.com/teramisuslik/MVP.git
cd MVP

# Запуск всех сервисов
docker-compose up -d

# Проверка статуса
docker-compose ps
```

### Environment Variables
```env
# .env.development
NODE_ENV=development
LOG_LEVEL=debug

# Database
AUTH_DATABASE_URL=postgresql://user:password@auth-db:5432/auth_db
BILLING_DATABASE_URL=postgresql://user:password@billing-db:5432/billing_db
ORCHESTRATOR_DATABASE_URL=postgresql://user:password@orchestrator-db:5432/orchestrator_db
ANALYTICS_DATABASE_URL=postgresql://user:password@analytics-db:5432/analytics_db

# Redis
REDIS_URL=redis://redis:6379

# RabbitMQ
RABBITMQ_URL=amqp://user:password@rabbitmq:5672

# API Keys
OPENAI_API_KEY=your-openai-key
OPENROUTER_API_KEY=your-openrouter-key
YANDEX_API_KEY=your-yandex-key

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=1h
```

### Локальная разработка
```bash
# Запуск только базы данных
docker-compose up -d auth-db billing-db orchestrator-db analytics-db redis rabbitmq

# Запуск сервисов локально
cd services/api-gateway
npm install
npm run start:dev

# В другом терминале
cd services/auth-service
npm install
npm run start:dev
```

## 🏭 Staging

### Предварительные требования
- Kubernetes cluster
- Helm 3+
- kubectl
- Docker registry

### Kubernetes манифесты
```yaml
# k8s/api-gateway.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: ai-aggregator/api-gateway:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "staging"
        - name: AUTH_SERVICE_URL
          value: "http://auth-service:3001"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
spec:
  selector:
    app: api-gateway
  ports:
  - port: 3000
    targetPort: 3000
  type: LoadBalancer
```

### Helm Chart
```yaml
# helm/ai-aggregator/values.yaml
global:
  imageRegistry: "your-registry.com"
  imageTag: "latest"
  environment: "staging"

apiGateway:
  replicaCount: 3
  image:
    repository: "ai-aggregator/api-gateway"
    tag: "latest"
  service:
    type: LoadBalancer
    port: 3000
  resources:
    requests:
      memory: "256Mi"
      cpu: "250m"
    limits:
      memory: "512Mi"
      cpu: "500m"

authService:
  replicaCount: 2
  image:
    repository: "ai-aggregator/auth-service"
    tag: "latest"
  service:
    port: 3001
  resources:
    requests:
      memory: "256Mi"
      cpu: "250m"
    limits:
      memory: "512Mi"
      cpu: "500m"
```

### Развертывание
```bash
# Установка Helm chart
helm install ai-aggregator ./helm/ai-aggregator \
  --namespace ai-aggregator \
  --create-namespace \
  --values ./helm/ai-aggregator/values-staging.yaml

# Проверка статуса
kubectl get pods -n ai-aggregator
kubectl get services -n ai-aggregator
```

## 🏢 Production

### Предварительные требования
- Kubernetes cluster (production-ready)
- Helm 3+
- kubectl
- Docker registry
- SSL certificates
- Monitoring stack (Prometheus, Grafana)
- Logging stack (ELK)

### Production конфигурация
```yaml
# helm/ai-aggregator/values-production.yaml
global:
  imageRegistry: "your-registry.com"
  imageTag: "v1.0.0"
  environment: "production"

apiGateway:
  replicaCount: 5
  image:
    repository: "ai-aggregator/api-gateway"
    tag: "v1.0.0"
  service:
    type: LoadBalancer
    port: 3000
    annotations:
      service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
  resources:
    requests:
      memory: "512Mi"
      cpu: "500m"
    limits:
      memory: "1Gi"
      cpu: "1000m"
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70

authService:
  replicaCount: 3
  image:
    repository: "ai-aggregator/auth-service"
    tag: "v1.0.0"
  service:
    port: 3001
  resources:
    requests:
      memory: "512Mi"
      cpu: "500m"
    limits:
      memory: "1Gi"
      cpu: "1000m"
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 8
    targetCPUUtilizationPercentage: 70
```

### SSL/TLS конфигурация
```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ai-aggregator-ingress
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - api.ai-aggregator.com
    secretName: ai-aggregator-tls
  rules:
  - host: api.ai-aggregator.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 3000
```

### Мониторинг
```yaml
# k8s/monitoring.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
    - job_name: 'ai-aggregator'
      static_configs:
      - targets: ['api-gateway:3000', 'auth-service:3001', 'billing-service:3004']
      metrics_path: '/metrics'
      scrape_interval: 5s
```

### Развертывание
```bash
# Создание namespace
kubectl create namespace ai-aggregator

# Установка cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Установка мониторинга
kubectl apply -f k8s/monitoring.yaml

# Установка приложения
helm install ai-aggregator ./helm/ai-aggregator \
  --namespace ai-aggregator \
  --values ./helm/ai-aggregator/values-production.yaml

# Проверка статуса
kubectl get pods -n ai-aggregator
kubectl get services -n ai-aggregator
kubectl get ingress -n ai-aggregator
```

## 🔧 CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Build Docker images
      run: |
        docker build -t ai-aggregator/api-gateway:${{ github.sha }} ./services/api-gateway
        docker build -t ai-aggregator/auth-service:${{ github.sha }} ./services/auth-service
        docker build -t ai-aggregator/billing-service:${{ github.sha }} ./services/billing-service
        docker build -t ai-aggregator/provider-orchestrator:${{ github.sha }} ./services/provider-orchestrator
        docker build -t ai-aggregator/proxy-service:${{ github.sha }} ./services/proxy-service
        docker build -t ai-aggregator/analytics-service:${{ github.sha }} ./services/analytics-service
    
    - name: Push to registry
      run: |
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker push ai-aggregator/api-gateway:${{ github.sha }}
        docker push ai-aggregator/auth-service:${{ github.sha }}
        docker push ai-aggregator/billing-service:${{ github.sha }}
        docker push ai-aggregator/provider-orchestrator:${{ github.sha }}
        docker push ai-aggregator/proxy-service:${{ github.sha }}
        docker push ai-aggregator/analytics-service:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Kubernetes
      run: |
        echo "${{ secrets.KUBE_CONFIG }}" | base64 -d > kubeconfig
        export KUBECONFIG=kubeconfig
        
        helm upgrade --install ai-aggregator ./helm/ai-aggregator \
          --namespace ai-aggregator \
          --values ./helm/ai-aggregator/values-production.yaml \
          --set global.imageTag=${{ github.sha }}
```

## 📊 Мониторинг и логирование

### Prometheus метрики
```yaml
# k8s/prometheus.yaml
apiVersion: v1
kind: Service
metadata:
  name: prometheus
spec:
  selector:
    app: prometheus
  ports:
  - port: 9090
    targetPort: 9090
  type: LoadBalancer
```

### Grafana дашборды
```json
{
  "dashboard": {
    "title": "AI Aggregator Overview",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{service}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      }
    ]
  }
}
```

### ELK Stack
```yaml
# k8s/elk.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: elasticsearch
spec:
  replicas: 3
  selector:
    matchLabels:
      app: elasticsearch
  template:
    metadata:
      labels:
        app: elasticsearch
    spec:
      containers:
      - name: elasticsearch
        image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
        env:
        - name: discovery.type
          value: "single-node"
        - name: xpack.security.enabled
          value: "false"
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
```

## 🔒 Безопасность

### Secrets management
```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: ai-aggregator-secrets
type: Opaque
data:
  jwt-secret: <base64-encoded-secret>
  openai-api-key: <base64-encoded-key>
  openrouter-api-key: <base64-encoded-key>
  yandex-api-key: <base64-encoded-key>
  database-url: <base64-encoded-url>
```

### Network policies
```yaml
# k8s/network-policies.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ai-aggregator-network-policy
spec:
  podSelector:
    matchLabels:
      app: ai-aggregator
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api-gateway
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: database
```

## 📈 Масштабирование

### Horizontal Pod Autoscaler
```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Database scaling
```yaml
# k8s/database.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgresql
spec:
  serviceName: postgresql
  replicas: 3
  selector:
    matchLabels:
      app: postgresql
  template:
    metadata:
      labels:
        app: postgresql
    spec:
      containers:
      - name: postgresql
        image: postgres:14
        env:
        - name: POSTGRES_DB
          value: "ai_aggregator"
        - name: POSTGRES_USER
          value: "user"
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgresql-secret
              key: password
        volumeMounts:
        - name: postgresql-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgresql-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 100Gi
```

## 🚨 Troubleshooting

### Общие проблемы
```bash
# Проверка статуса подов
kubectl get pods -n ai-aggregator

# Просмотр логов
kubectl logs -f deployment/api-gateway -n ai-aggregator

# Проверка событий
kubectl get events -n ai-aggregator

# Проверка ресурсов
kubectl top pods -n ai-aggregator
kubectl top nodes
```

### Отладка
```bash
# Подключение к поду
kubectl exec -it deployment/api-gateway -n ai-aggregator -- /bin/bash

# Проверка конфигурации
kubectl describe deployment api-gateway -n ai-aggregator

# Проверка сервисов
kubectl get services -n ai-aggregator
kubectl describe service api-gateway -n ai-aggregator
```

## 📚 Дополнительные ресурсы

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [ELK Stack Documentation](https://www.elastic.co/guide/)
