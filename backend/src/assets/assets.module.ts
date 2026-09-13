import { Module } from '@nestjs/common';
import { EmployeesModule } from '../employees/employees.module';
import { AssetsService } from './services/assets.service';
import { AssetsController } from './controllers/assets.controller';

@Module({
  imports: [EmployeesModule],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
