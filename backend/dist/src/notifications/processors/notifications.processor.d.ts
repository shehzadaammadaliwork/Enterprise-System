import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DispatchJobData, NotificationsService } from '../services/notifications.service';
import { EventsGateway } from '../../common/websocket/events.gateway';
export declare class NotificationsProcessor extends WorkerHost {
    private readonly notificationsService;
    private readonly eventsGateway;
    constructor(notificationsService: NotificationsService, eventsGateway: EventsGateway);
    process(job: Job<DispatchJobData>): Promise<void>;
}
