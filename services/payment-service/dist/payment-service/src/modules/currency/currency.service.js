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
var CurrencyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const shared_1 = require("@ai-aggregator/shared");
let CurrencyService = CurrencyService_1 = class CurrencyService {
    constructor(configService, httpService) {
        this.configService = configService;
        this.httpService = httpService;
        this.logger = new common_1.Logger(CurrencyService_1.name);
    }
    async getUsdToRubRate() {
        try {
            const apiUrl = this.configService.get('CBR_API_URL');
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(apiUrl));
            const usdRate = response.data.Valute.USD.Value;
            shared_1.LoggerUtil.info('payment-service', 'USD/RUB rate retrieved', {
                rate: usdRate
            });
            return usdRate;
        }
        catch (error) {
            shared_1.LoggerUtil.error('payment-service', 'Failed to get USD/RUB rate', error);
            return 95.0;
        }
    }
    async convertRubToUsd(rubAmount) {
        const rate = await this.getUsdToRubRate();
        return rubAmount / rate;
    }
    async convertUsdToRub(usdAmount) {
        const rate = await this.getUsdToRubRate();
        return usdAmount * rate;
    }
};
exports.CurrencyService = CurrencyService;
exports.CurrencyService = CurrencyService = CurrencyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService])
], CurrencyService);
//# sourceMappingURL=currency.service.js.map