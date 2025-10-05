import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AnalyticsService {
  private readonly analyticsServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.analyticsServiceUrl = this.configService.get('ANALYTICS_SERVICE_URL', 'http://analytics-service:3005');
  }

  async getMetrics(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.analyticsServiceUrl}/analytics/metrics`)
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException('Failed to get analytics metrics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getDashboard(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.analyticsServiceUrl}/analytics/dashboard`)
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException('Failed to get analytics dashboard', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getCollectionStats(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.analyticsServiceUrl}/analytics/stats/collection`)
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException('Failed to get collection statistics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getEventsSummary(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.analyticsServiceUrl}/analytics/events/summary`)
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException('Failed to get events summary', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async trackEvent(eventData: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.analyticsServiceUrl}/analytics/track-event`, eventData)
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException('Failed to track event', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async trackEventAlternative(eventData: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.analyticsServiceUrl}/analytics/events/track`, eventData)
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException('Failed to track event (alternative)', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

