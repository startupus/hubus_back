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
export declare class RabbitMQClient {
    private readonly RABBITMQ_SERVICE_URL;
    private readonly axiosInstance;
    constructor();
    publish(queue: string, message: any, options?: any): Promise<boolean>;
    consume(queue: string, handler: (message: any) => Promise<void>): Promise<boolean>;
    createQueue(queue: string, options?: any): Promise<boolean>;
    deleteQueue(queue: string): Promise<boolean>;
    publishCriticalMessage(queue: string, message: any): Promise<boolean>;
    subscribeToCriticalMessages(queue: string, handler: (message: any) => Promise<void>): Promise<boolean>;
}
