"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RabbitMQClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQClient = void 0;
const common_1 = require("@nestjs/common");
const amqp = __importStar(require("amqplib"));
let RabbitMQClient = RabbitMQClient_1 = class RabbitMQClient {
    logger = new common_1.Logger(RabbitMQClient_1.name);
    connection = null;
    channel = null;
    rabbitmqUrl;
    constructor() {
        this.rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://user:password@rabbitmq:5672';
    }
    async onModuleInit() {
        await this.connect();
    }
    async onModuleDestroy() {
        await this.disconnect();
    }
    async connect() {
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
        }
        catch (error) {
            this.logger.error('Failed to connect to RabbitMQ', error);
            throw error;
        }
    }
    async disconnect() {
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
        }
        catch (error) {
            this.logger.error('Error disconnecting from RabbitMQ', error);
        }
    }
    async publish(queue, message, options) {
        try {
            if (!this.channel) {
                throw new Error('RabbitMQ channel not available');
            }
            await this.channel.assertQueue(queue, { durable: true });
            const messageBuffer = Buffer.from(JSON.stringify(message));
            const publishOptions = {
                persistent: options?.persistent ?? true,
                priority: options?.priority,
            };
            const success = this.channel.sendToQueue(queue, messageBuffer, publishOptions);
            if (success) {
                this.logger.debug(`Message published to queue: ${queue}`);
            }
            else {
                this.logger.warn(`Failed to publish message to queue: ${queue}`);
            }
            return success;
        }
        catch (error) {
            this.logger.error('RabbitMQ publish error:', error);
            return false;
        }
    }
    async consume(queue, handler) {
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
                        this.channel.ack(msg);
                    }
                    catch (error) {
                        this.logger.error('Error processing message', error);
                        this.channel.nack(msg, false, false);
                    }
                }
            });
            this.logger.log(`Started consuming from queue: ${queue}`);
            return true;
        }
        catch (error) {
            this.logger.error('RabbitMQ consume error:', error);
            return false;
        }
    }
    async createQueue(queue, options) {
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
        }
        catch (error) {
            this.logger.error('RabbitMQ createQueue error:', error);
            return false;
        }
    }
    async deleteQueue(queue) {
        try {
            if (!this.channel) {
                throw new Error('RabbitMQ channel not available');
            }
            await this.channel.deleteQueue(queue);
            this.logger.log(`Queue deleted: ${queue}`);
            return true;
        }
        catch (error) {
            this.logger.error('RabbitMQ deleteQueue error:', error);
            return false;
        }
    }
    async publishCriticalMessage(queue, message) {
        return this.publish(queue, message, { persistent: true, priority: 10 });
    }
    async subscribeToCriticalMessages(queue, handler) {
        return this.consume(queue, handler);
    }
};
exports.RabbitMQClient = RabbitMQClient;
exports.RabbitMQClient = RabbitMQClient = RabbitMQClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RabbitMQClient);
//# sourceMappingURL=rabbitmq.client.js.map