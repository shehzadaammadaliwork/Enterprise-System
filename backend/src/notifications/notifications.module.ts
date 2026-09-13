import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../auth/auth.module';
import {
  NOTIFICATIONS_QUEUE,
  NotificationsService,
} from './services/notifications.service';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsProcessor } from './processors/notifications.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE }),
    AuthModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
