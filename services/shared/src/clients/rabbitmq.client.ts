import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';
import { Connection, Channel } from 'amqplib';

export interface RabbitMQPublishRequest {
  queue: string;
  message: any;
  options?: {
    persistent?: boolean;
    priority?: number;
    delay?: number;
  };
}

export interface RabbitMQConsumeRequest {
  queue: string;
  handler: (message: any) => Promise<void>;
}

@Injectable()
export class RabbitMQClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQClient.name);
  private connection: any = null;
  private channel: any = null;
  private readonly rabbitmqUrl: string;

  constructor() {
    this.rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://user:password@rabbitmq:5672';
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      this.connection = await amqp.connect(this.rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed, attempting to reconnect...');
        setTimeout(() => this.connect(), 5000);
      });

      this.connection.on('error', (error) => {
        this.logger.error('RabbitMQ connection error', error);
      });

      this.logger.log('Connected to RabbitMQ');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  private async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', error);
    }
  }

  async publish(queue: string, message: any, options?: any): Promise<boolean> {
    try {
      if (!this.channel) {
        throw new Error('RabbitMQ channel not available');
      }

      await this.channel.assertQueue(queue, { durable: true });
      
      const messageBuffer = Buffer.from(JSON.stringify(message));
      const publishOptions: amqp.Options.Publish = {
        persistent: options?.persistent ?? true,
        priority: options?.priority,
      };

      const success = this.channel.sendToQueue(queue, messageBuffer, publishOptions);
      
      if (success) {
        this.logger.debug(`Message published to queue: ${queue}`);
      } else {
        this.logger.warn(`Failed to publish message to queue: ${queue}`);
      }

      return success;
    } catch (error) {
      this.logger.error('RabbitMQ publish error:', error);
      return false;
    }
  }

  async consume(queue: string, handler: (message: any) => Promise<void>): Promise<boolean> {
    try {
      if (!this.channel) {
        throw new Error('RabbitMQ channel not available');
      }

      await this.channel.assertQueue(queue, { durable: true });
      
      await this.channel.consume(queue, async (msg) => {
        if (msg) {
          try {
            const message = JSON.parse(msg.content.toString());
            await handler(message);
            this.channel!.ack(msg);
          } catch (error) {
            this.logger.error('Error processing message', error);
            this.channel!.nack(msg, false, false);
          }
        }
      });

      this.logger.log(`Started consuming from queue: ${queue}`);
      return true;
    } catch (error) {
      this.logger.error('RabbitMQ consume error:', error);
      return false;
    }
  }

  async createQueue(queue: string, options?: any): Promise<boolean> {
    try {
      if (!this.channel) {
        throw new Error('RabbitMQ channel not available');
      }

      await this.channel.assertQueue(queue, { 
        durable: true,
        ...options 
      });
      
      this.logger.log(`Queue created: ${queue}`);
      return true;
    } catch (error) {
      this.logger.error('RabbitMQ createQueue error:', error);
      return false;
    }
  }

  async deleteQueue(queue: string): Promise<boolean> {
    try {
      if (!this.channel) {
        throw new Error('RabbitMQ channel not available');
      }

      await this.channel.deleteQueue(queue);
      this.logger.log(`Queue deleted: ${queue}`);
      return true;
    } catch (error) {
      this.logger.error('RabbitMQ deleteQueue error:', error);
      return false;
    }
  }

  async publishCriticalMessage(queue: string, message: any): Promise<boolean> {
    return this.publish(queue, message, { persistent: true, priority: 10 });
  }

  async subscribeToCriticalMessages(queue: string, handler: (message: any) => Promise<void>): Promise<boolean> {
    return this.consume(queue, handler);
  }
}
