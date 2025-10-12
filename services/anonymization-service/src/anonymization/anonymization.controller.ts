import { Controller, Post, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { AnonymizationService } from './anonymization.service';
import { 
  AnonymizeRequestDto, 
  AnonymizeResponseDto,
  DeanonymizeRequestDto,
  DeanonymizeResponseDto,
  AnonymizationSettingsDto,
  AnonymizationSettingsResponseDto
} from './dto/anonymization.dto';

@Controller('anonymization')
export class AnonymizationController {
  constructor(private readonly anonymizationService: AnonymizationService) {}

  @Post('anonymize')
  async anonymize(@Body() request: AnonymizeRequestDto): Promise<AnonymizeResponseDto> {
    return this.anonymizationService.anonymize(request);
  }

  @Post('deanonymize')
  async deanonymize(@Body() request: DeanonymizeRequestDto): Promise<DeanonymizeResponseDto> {
    return this.anonymizationService.deanonymize(request);
  }

  @Get('settings/:userId')
  async getSettings(@Param('userId') userId: string): Promise<AnonymizationSettingsResponseDto> {
    return this.anonymizationService.getSettings(userId);
  }

  @Put('settings/:userId')
  async updateSettings(
    @Param('userId') userId: string,
    @Body() settings: AnonymizationSettingsDto
  ): Promise<AnonymizationSettingsResponseDto> {
    return this.anonymizationService.updateSettings(userId, settings);
  }

  @Delete('settings/:userId')
  async deleteSettings(@Param('userId') userId: string): Promise<{ message: string }> {
    await this.anonymizationService.deleteSettings(userId);
    return { message: 'Settings deleted successfully' };
  }
}