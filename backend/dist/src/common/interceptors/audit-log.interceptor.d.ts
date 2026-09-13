import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../websocket/events.gateway';
export declare class AuditLogInterceptor implements NestInterceptor {
    private readonly prisma;
    private readonly reflector;
    private readonly eventsGateway;
    constructor(prisma: PrismaService, reflector: Reflector, eventsGateway: EventsGateway);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}
