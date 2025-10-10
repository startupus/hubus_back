import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { LoggerUtil } from '@ai-aggregator/shared';

interface CbrResponse {
  Valute: {
    USD: {
      Value: number;
      Previous: number;
    };
  };
}

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Получить текущий курс USD/RUB от ЦБ РФ
   */
  async getUsdToRubRate(): Promise<number> {
    try {
      const apiUrl = this.configService.get('CBR_API_URL');
      const response = await firstValueFrom(
        this.httpService.get<CbrResponse>(apiUrl)
      );

      const usdRate = response.data.Valute.USD.Value;
      
      LoggerUtil.info('payment-service', 'USD/RUB rate retrieved', { 
        rate: usdRate 
      });

      return usdRate;
    } catch (error) {
      LoggerUtil.error('payment-service', 'Failed to get USD/RUB rate', error as Error);
      // Возвращаем примерный курс в случае ошибки
      return 95.0;
    }
  }

  /**
   * Конвертировать рубли в доллары
   */
  async convertRubToUsd(rubAmount: number): Promise<number> {
    const rate = await this.getUsdToRubRate();
    return rubAmount / rate;
  }

  /**
   * Конвертировать доллары в рубли
   */
  async convertUsdToRub(usdAmount: number): Promise<number> {
    const rate = await this.getUsdToRubRate();
    return usdAmount * rate;
  }
}
