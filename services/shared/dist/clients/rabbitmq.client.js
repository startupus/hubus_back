"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQClient = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let RabbitMQClient = class RabbitMQClient {
    RABBITMQ_SERVICE_URL = process.env.RABBITMQ_SERVICE_URL || 'http://rabbitmq-service:3010';
    axiosInstance;
    constructor() {
        this.axiosInstance = axios_1.default.create({
            timeout: 10000,
            maxRedirects: 3,
        });
    }
    async publish(queue, message, options) {
        try {
            const response = await this.axiosInstance.post(`${this.RABBITMQ_SERVICE_URL}/api/rabbitmq/publish`, {
                queue,
                message,
                options
            });
            return response.data.success;
        }
        catch (error) {
            console.error('RabbitMQ publish error:', error);
            return false;
        }
    }
    async consume(queue, handler) {
        try {
            const response = await this.axiosInstance.post(`${this.RABBITMQ_SERVICE_URL}/api/rabbitmq/consume`, {
                queue,
                handler: handler.toString() // Note: This is a simplified approach
            });
            return response.data.success;
        }
        catch (error) {
            console.error('RabbitMQ consume error:', error);
            return false;
        }
    }
    async createQueue(queue, options) {
        try {
            const response = await this.axiosInstance.post(`${this.RABBITMQ_SERVICE_URL}/api/rabbitmq/create-queue`, {
                queue,
                options
            });
            return response.data.success;
        }
        catch (error) {
            console.error('RabbitMQ createQueue error:', error);
            return false;
        }
    }
    async deleteQueue(queue) {
        try {
            const response = await this.axiosInstance.delete(`${this.RABBITMQ_SERVICE_URL}/api/rabbitmq/delete-queue/${encodeURIComponent(queue)}`);
            return response.data.success;
        }
        catch (error) {
            console.error('RabbitMQ deleteQueue error:', error);
            return false;
        }
    }
    async publishCriticalMessage(queue, message) {
        try {
            const response = await this.axiosInstance.post(`${this.RABBITMQ_SERVICE_URL}/api/rabbitmq/publish-critical`, {
                queue,
                message
            });
            return response.data.success;
        }
        catch (error) {
            console.error('RabbitMQ publishCriticalMessage error:', error);
            return false;
        }
    }
    async subscribeToCriticalMessages(queue, handler) {
        try {
            const response = await this.axiosInstance.post(`${this.RABBITMQ_SERVICE_URL}/api/rabbitmq/subscribe-critical`, {
                queue,
                handler: handler.toString() // Note: This is a simplified approach
            });
            return response.data.success;
        }
        catch (error) {
            console.error('RabbitMQ subscribeToCriticalMessages error:', error);
            return false;
        }
    }
};
exports.RabbitMQClient = RabbitMQClient;
exports.RabbitMQClient = RabbitMQClient = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RabbitMQClient);
//# sourceMappingURL=rabbitmq.client.js.map