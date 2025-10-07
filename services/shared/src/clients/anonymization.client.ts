import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { 
  AnonymizeRequest, 
  AnonymizeResponse,
  DeanonymizeRequest,
  DeanonymizeResponse,
  AnonymizationSettings,
  AnonymizationSettingsResponse
} from '../contracts/anonymization.contract';

@Injectable()
export class AnonymizationClient {
  private readonly ANONYMIZATION_SERVICE_URL = process.env.ANONYMIZATION_SERVICE_URL || 'http://anonymization-service:3008';
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 10000,
      maxRedirects: 3,
    });
  }

  async anonymize(request: AnonymizeRequest): Promise<AnonymizeResponse> {
    const response = await this.axiosInstance.post<AnonymizeResponse>(`${this.ANONYMIZATION_SERVICE_URL}/anonymization/anonymize`, request);
    return response.data;
  }

  async deanonymize(request: DeanonymizeRequest): Promise<DeanonymizeResponse> {
    const response = await this.axiosInstance.post<DeanonymizeResponse>(`${this.ANONYMIZATION_SERVICE_URL}/anonymization/deanonymize`, request);
    return response.data;
  }

  async getSettings(userId: string): Promise<AnonymizationSettingsResponse> {
    const response = await this.axiosInstance.get<AnonymizationSettingsResponse>(`${this.ANONYMIZATION_SERVICE_URL}/anonymization/settings/${userId}`);
    return response.data;
  }

  async updateSettings(userId: string, settings: AnonymizationSettings): Promise<AnonymizationSettingsResponse> {
    const response = await this.axiosInstance.put<AnonymizationSettingsResponse>(`${this.ANONYMIZATION_SERVICE_URL}/anonymization/settings/${userId}`, settings);
    return response.data;
  }

  async deleteSettings(userId: string): Promise<{ message: string }> {
    const response = await this.axiosInstance.delete<{ message: string }>(`${this.ANONYMIZATION_SERVICE_URL}/anonymization/settings/${userId}`);
    return response.data;
  }
}
