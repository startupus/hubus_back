import { Controller, Post, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AnonymizationService } from './anonymization.service';
import { 
  AnonymizeRequestDto, 
  AnonymizeResponseDto,
  DeanonymizeRequestDto,
  DeanonymizeResponseDto,
  AnonymizationSettingsDto,
  AnonymizationSettingsResponseDto
} from './dto/anonymization.dto';

@ApiTags('anonymization')
@Controller('anonymization')
export class AnonymizationController {
  constructor(private readonly anonymizationService: AnonymizationService) {}

  @Post('anonymize')
  @ApiOperation({ summary: 'Anonymize chat messages or text' })
  @ApiBody({ type: AnonymizeRequestDto })
  @ApiResponse({ status: 200, type: AnonymizeResponseDto })
  async anonymize(@Body() request: AnonymizeRequestDto): Promise<AnonymizeResponseDto> {
    return this.anonymizationService.anonymize(request);
  }

  @Post('deanonymize')
  @ApiOperation({ summary: 'Deanonymize chat messages or text' })
  @ApiBody({ type: DeanonymizeRequestDto })
  @ApiResponse({ status: 200, type: DeanonymizeResponseDto })
  async deanonymize(@Body() request: DeanonymizeRequestDto): Promise<DeanonymizeResponseDto> {
    return this.anonymizationService.deanonymize(request);
  }

  @Get('settings/:userId')
  @ApiOperation({ summary: 'Get anonymization settings for user' })
  @ApiResponse({ status: 200, type: AnonymizationSettingsResponseDto })
  async getSettings(@Param('userId') userId: string): Promise<AnonymizationSettingsResponseDto> {
    return this.anonymizationService.getSettings(userId);
  }

  @Put('settings/:userId')
  @ApiOperation({ summary: 'Update anonymization settings for user' })
  @ApiBody({ type: AnonymizationSettingsDto })
  @ApiResponse({ status: 200, type: AnonymizationSettingsResponseDto })
  async updateSettings(
    @Param('userId') userId: string,
    @Body() settings: AnonymizationSettingsDto
  ): Promise<AnonymizationSettingsResponseDto> {
    return this.anonymizationService.updateSettings(userId, settings);
  }

  @Delete('settings/:userId')
  @ApiOperation({ summary: 'Delete anonymization settings for user' })
  @ApiResponse({ status: 200, description: 'Settings deleted successfully' })
  async deleteSettings(@Param('userId') userId: string): Promise<{ message: string }> {
    await this.anonymizationService.deleteSettings(userId);
    return { message: 'Settings deleted successfully' };
  }
}
