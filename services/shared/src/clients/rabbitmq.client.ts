import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

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
export class RabbitMQClient {
  private readonly RABBITMQ_SERVICE_URL = process.env.RABBITMQ_SERVICE_URL || 'http://rabbitmq-service:3010';
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 10000,
      maxRedirects: 3,
    });
  }

  async publish(queue: string, message: any, options?: any): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post<{ success: boolean }>(`${this.RABBITMQ_SERVICE_URL}/api/rabbitmq/publish`, {
        queue,
        message,
        options
      });
      return response.data.success;
    } catch (error) {
      console.error('RabbitMQ publish error:', error);
      return false;
    }
  }

  async consume(queue: string, handler: (message: any) => Promise<void>): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post<{ success: boolean }>(`${this.RABBITMQ_SERVICE_URL}/api/rabbitmq/consume`, {
        queue,
        handler: handler.toString() // Note: This is a simplified approach
      });
      return response.data.success;
    } catch (error) {
      console.error('RabbitMQ consume error:', error);
      return false;
    }
  }

  async createQueue(queue: string, options?: any): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post<{ success: boolean }>(`${this.RABBITMQ_SERVICE_URL}/api/rabbitmq/create-queue`, {
        queue,
        options
      });
      return response.data.success;
    } catch (error) {
      console.error('RabbitMQ createQueue error:', error);
      return false;
    }
  }

  async deleteQueue(queue: string): Promise<boolean> {
    try {
      const response = await this.axiosInstance.delete<{ success: boolean }>(`${this.RABBITMQ_SERVICE_URL}/api/rabbitmq/delete-queue/${encodeURIComponent(queue)}`);
      return response.data.success;
    } catch (error) {
      console.error('RabbitMQ deleteQueue error:', error);
      return false;
    }
  }

  async publishCriticalMessage(queue: string, message: any): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post<{ success: boolean }>(`${this.RABBITMQ_SERVICE_URL}/api/rabbitmq/publish-critical`, {
        queue,
        message
      });
      return response.data.success;
    } catch (error) {
      console.error('RabbitMQ publishCriticalMessage error:', error);
      return false;
    }
  }

  async subscribeToCriticalMessages(queue: string, handler: (message: any) => Promise<void>): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post<{ success: boolean }>(`${this.RABBITMQ_SERVICE_URL}/api/rabbitmq/subscribe-critical`, {
        queue,
        handler: handler.toString() // Note: This is a simplified approach
      });
      return response.data.success;
    } catch (error) {
      console.error('RabbitMQ subscribeToCriticalMessages error:', error);
      return false;
    }
  }
}
