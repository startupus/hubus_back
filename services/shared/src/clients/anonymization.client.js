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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnonymizationClient = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
let AnonymizationClient = class AnonymizationClient {
    constructor() {
        this.ANONYMIZATION_SERVICE_URL = process.env.ANONYMIZATION_SERVICE_URL || 'http://anonymization-service:3008';
        this.axiosInstance = axios_1.default.create({
            timeout: 10000,
            maxRedirects: 3,
        });
    }
    async anonymize(request) {
        const response = await this.axiosInstance.post(`${this.ANONYMIZATION_SERVICE_URL}/anonymization/anonymize`, request);
        return response.data;
    }
    async deanonymize(request) {
        const response = await this.axiosInstance.post(`${this.ANONYMIZATION_SERVICE_URL}/anonymization/deanonymize`, request);
        return response.data;
    }
    async getSettings(userId) {
        const response = await this.axiosInstance.get(`${this.ANONYMIZATION_SERVICE_URL}/anonymization/settings/${userId}`);
        return response.data;
    }
    async updateSettings(userId, settings) {
        const response = await this.axiosInstance.put(`${this.ANONYMIZATION_SERVICE_URL}/anonymization/settings/${userId}`, settings);
        return response.data;
    }
    async deleteSettings(userId) {
        const response = await this.axiosInstance.delete(`${this.ANONYMIZATION_SERVICE_URL}/anonymization/settings/${userId}`);
        return response.data;
    }
};
exports.AnonymizationClient = AnonymizationClient;
exports.AnonymizationClient = AnonymizationClient = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AnonymizationClient);
//# sourceMappingURL=anonymization.client.js.map