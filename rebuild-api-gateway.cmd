docker stop project-api-gateway-1
docker-compose build api-gateway
docker-compose up -d api-gateway
timeout /t 15
docker logs --tail=30 project-api-gateway-1

