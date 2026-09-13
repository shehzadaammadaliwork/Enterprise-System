import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AppConfig } from '../config/configuration';
export declare class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    private readonly configService;
    server: Server;
    private readonly logger;
    private readonly userSockets;
    constructor(jwtService: JwtService, configService: ConfigService<AppConfig, true>);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    emitToUser(userId: string, event: string, payload: unknown): void;
    emitToAll(event: string, payload: unknown): void;
    emitToRoom(room: string, event: string, payload: unknown): void;
    private extractToken;
}
