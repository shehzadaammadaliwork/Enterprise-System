import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RbacModule } from '../rbac/rbac.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmployeesService } from './services/employees.service';
import { AttendanceService } from './services/attendance.service';
import { LeaveService } from './services/leave.service';
import { PayrollService, PAYROLL_QUEUE } from './services/payroll.service';
import { PerformanceReviewService } from './services/performance-review.service';
import { EmployeesController } from './controllers/employees.controller';
import { UsersController } from './controllers/users.controller';
import { AttendanceController } from './controllers/attendance.controller';
import { LeaveController } from './controllers/leave.controller';
import { PayrollController } from './controllers/payroll.controller';
import {
  PerformanceReviewController,
  MyPerformanceReviewController,
} from './controllers/performance-review.controller';
import { PayrollProcessor } from './processors/payroll.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: PAYROLL_QUEUE }),
    RbacModule,
    NotificationsModule,
  ],
  controllers: [
    EmployeesController,
    UsersController,
    AttendanceController,
    LeaveController,
    PayrollController,
    PerformanceReviewController,
    MyPerformanceReviewController,
  ],
  providers: [
    EmployeesService,
    AttendanceService,
    LeaveService,
    PayrollService,
    PerformanceReviewService,
    PayrollProcessor,
  ],
  exports: [EmployeesService, LeaveService, AttendanceService],
})
export class EmployeesModule {}
