import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService]
})
export class EmployeeModule {}
