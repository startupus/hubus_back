import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
/**
 * RabbitMQ Service для критических операций
 *
 * Обеспечивает:
 * - Гарантированную доставку сообщений
 * - Retry механизмы
 * - Dead letter queues
 * - Мониторинг очередей
 */
export declare class RabbitMQService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private connection;
    private channel;
    private readonly retryAttempts;
    private readonly retryDelay;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    /**
     * Подключение к RabbitMQ
     */
    private connect;
    /**
     * Отключение от RabbitMQ
     */
    private disconnect;
    /**
     * Настройка Dead Letter Exchange для обработки неудачных сообщений
     */
    private setupDeadLetterExchange;
    /**
     * Отправка критического сообщения с гарантированной доставкой
     */
    publishCriticalMessage(queueName: string, message: any, options?: {
        persistent?: boolean;
        priority?: number;
        expiration?: string;
        retryCount?: number;
    }): Promise<boolean>;
    /**
     * Подписка на критические сообщения с обработкой ошибок
     */
    subscribeToCriticalMessages(queueName: string, handler: (message: any) => Promise<boolean>, options?: {
        autoAck?: boolean;
        exclusive?: boolean;
    }): Promise<void>;
    /**
     * Обработка неудачных сообщений с retry логикой
     */
    private handleFailedMessage;
    /**
     * Генерация уникального ID сообщения
     */
    private generateMessageId;
    /**
     * Проверка состояния соединения
     */
    isConnected(): boolean;
    /**
     * Получение статистики очередей
     */
    getQueueStats(queueName: string): Promise<{
        messageCount: number;
        consumerCount: number;
    }>;
    /**
     * Отправить сообщение в очередь
     */
    publish(queue: string, message: any, options?: any): Promise<boolean>;
    /**
     * Отправить сообщение в exchange
     */
    publishToExchange(exchange: string, routingKey: string, message: any, options?: any): Promise<boolean>;
    /**
     * Подписаться на очередь
     */
    subscribe(queue: string, handler: (message: any) => Promise<boolean>): Promise<void>;
    /**
     * Отправить сообщение с retry
     */
    publishWithRetry(queue: string, message: any, maxRetries?: number, delay?: number): Promise<boolean>;
    /**
     * Отправить сообщение в Dead Letter Queue
     */
    publishToDeadLetterQueue(originalQueue: string, message: any, error: Error): Promise<boolean>;
    /**
     * Получить информацию о очереди
     */
    getQueueInfo(queue: string): Promise<any>;
    /**
     * Очистить очередь
     */
    purgeQueue(queue: string): Promise<number>;
    /**
     * Удалить очередь
     */
    deleteQueue(queue: string): Promise<number>;
    /**
     * Привязать очередь к exchange
     */
    bindQueue(queue: string, exchange: string, routingKey: string): Promise<void>;
    /**
     * Отвязать очередь от exchange
     */
    unbindQueue(queue: string, exchange: string, routingKey: string): Promise<void>;
    /**
     * Получить информацию о exchange
     */
    getExchangeInfo(exchange: string): Promise<any>;
    /**
     * Удалить exchange
     */
    deleteExchange(exchange: string): Promise<void>;
    /**
     * Получить информацию о соединении
     */
    getConnectionInfo(): Promise<any>;
    /**
     * Переподключиться к RabbitMQ
     */
    reconnect(): Promise<void>;
    /**
     * Закрыть соединение
     */
    close(): Promise<void>;
    /**
     * Проверка здоровья соединения
     */
    healthCheck(): Promise<{
        status: string;
        message: string;
    }>;
}
//# sourceMappingURL=rabbitmq.service.d.ts.map