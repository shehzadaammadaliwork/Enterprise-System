import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AppConfig } from '../config/configuration';

interface JwtAccessPayload {
  sub: string;
}

/// The single shared WebSocket gateway (Architecture Rule, Section 2). Every
/// module that needs to push a real-time event (dashboards, notifications,
/// live updates) injects `EventsGateway` and calls `emitToUser`/`emitToAll`
/// rather than opening its own socket namespace.
///
/// `@WebSocketGateway`'s options are evaluated at class-definition time,
/// before Nest's DI container exists, so this reads `process.env` directly
/// rather than going through ConfigService (same value main.ts's CORS setup
/// reads via ConfigService). A wildcard origin is rejected by browsers once
/// credentials are involved, so this must be a concrete origin.
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);
  /// userId -> connected socket ids, so a user's events reach every open tab/device.
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      const payload = this.jwtService.verify<JwtAccessPayload>(token, {
        secret: this.configService.get('jwt', { infer: true }).accessSecret,
      });
      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);
      const sockets = this.userSockets.get(payload.sub) ?? new Set<string>();
      sockets.add(client.id);
      this.userSockets.set(payload.sub, sockets);
    } catch {
      this.logger.warn(
        `Rejected unauthenticated socket connection ${client.id}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId: string | undefined = client.data.userId;
    if (userId) {
      const sockets = this.userSockets.get(userId);
      sockets?.delete(client.id);
      if (sockets && sockets.size === 0) this.userSockets.delete(userId);
    }
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  emitToAll(event: string, payload: unknown) {
    this.server.emit(event, payload);
  }

  emitToRoom(room: string, event: string, payload: unknown) {
    this.server.to(room).emit(event, payload);
  }

  private extractToken(client: Socket): string {
    const header =
      client.handshake.auth?.token ?? client.handshake.headers.authorization;
    if (!header) throw new Error('No token provided');
    return header.startsWith('Bearer ') ? header.slice(7) : header;
  }
}
