import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { RedisService } from './redis.service';

@Controller('api/redis')
export class RedisController {
  constructor(private readonly redisService: RedisService) {}

  @Get('health')
  async health() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'redis-service',
      version: '1.0.0',
      uptime: process.uptime()
    };
  }

  @Get('status')
  async status() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'redis-service'
    };
  }

  @Post('set')
  async set(@Body() body: { key: string; value: any; ttl?: number }) {
    const success = await this.redisService.set(body.key, body.value, body.ttl);
    return { success };
  }

  @Get('get/:key')
  async get(@Param('key') key: string) {
    const data = await this.redisService.get(key);
    return { data };
  }

  @Post('mdelete')
  async mdelete(@Body() body: { keys: string[] }) {
    const deleted = await this.redisService.mdelete(body.keys);
    return { deleted };
  }

  @Get('keys/:pattern')
  async keys(@Param('pattern') pattern: string) {
    const keys = await this.redisService.keys(pattern);
    return { keys };
  }

  @Delete('clear-pattern/:pattern')
  async clearPattern(@Param('pattern') pattern: string) {
    const deleted = await this.redisService.clearPattern(pattern);
    return { deleted };
  }
}
