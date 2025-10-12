import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
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
export declare class RabbitMQClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private connection;
    private channel;
    private readonly rabbitmqUrl;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private connect;
    private disconnect;
    publish(queue: string, message: any, options?: any): Promise<boolean>;
    consume(queue: string, handler: (message: any) => Promise<void>): Promise<boolean>;
    createQueue(queue: string, options?: any): Promise<boolean>;
    deleteQueue(queue: string): Promise<boolean>;
    publishCriticalMessage(queue: string, message: any): Promise<boolean>;
    subscribeToCriticalMessages(queue: string, handler: (message: any) => Promise<void>): Promise<boolean>;
}
//# sourceMappingURL=rabbitmq.client.d.ts.map