import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NotificationChannel } from '@prisma/client';
import {
  DispatchJobData,
  NOTIFICATIONS_QUEUE,
  NotificationsService,
} from '../services/notifications.service';
import { EventsGateway } from '../../common/websocket/events.gateway';

/// BullMQ worker for the spec's "delivered via BullMQ jobs" requirement —
/// NotificationsService.notify()/broadcast() enqueue one job per enabled
/// channel here, keyed by channel name (matches PayrollProcessor's
/// one-processor-per-queue shape). IN_APP is the only channel with a real
/// destination in this codebase today; EMAIL/SMS/PUSH log a delivery stub
/// (see NotificationsService.logStubDelivery's doc comment).
@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly eventsGateway: EventsGateway,
  ) {
    super();
  }

  async process(job: Job<DispatchJobData>): Promise<void> {
    const data = job.data;
    if (data.channel === NotificationChannel.IN_APP) {
      await this.notificationsService.createInAppRecord(data);
      this.eventsGateway.emitToUser(data.userId, 'notification:new', {
        eventType: data.eventType,
        title: data.title,
        message: data.message,
        data: data.data,
      });
      return;
    }
    this.notificationsService.logStubDelivery(data);
  }
}
