import { Module } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [EmployeeService],
  exports: [EmployeeService],
})
export class EmployeeModule {}
