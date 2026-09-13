"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EventsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsGateway = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let EventsGateway = EventsGateway_1 = class EventsGateway {
    jwtService;
    configService;
    server;
    logger = new common_1.Logger(EventsGateway_1.name);
    userSockets = new Map();
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
    }
    handleConnection(client) {
        try {
            const token = this.extractToken(client);
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('jwt', { infer: true }).accessSecret,
            });
            client.data.userId = payload.sub;
            client.join(`user:${payload.sub}`);
            const sockets = this.userSockets.get(payload.sub) ?? new Set();
            sockets.add(client.id);
            this.userSockets.set(payload.sub, sockets);
        }
        catch {
            this.logger.warn(`Rejected unauthenticated socket connection ${client.id}`);
            client.disconnect(true);
        }
    }
    handleDisconnect(client) {
        const userId = client.data.userId;
        if (userId) {
            const sockets = this.userSockets.get(userId);
            sockets?.delete(client.id);
            if (sockets && sockets.size === 0)
                this.userSockets.delete(userId);
        }
    }
    emitToUser(userId, event, payload) {
        this.server.to(`user:${userId}`).emit(event, payload);
    }
    emitToAll(event, payload) {
        this.server.emit(event, payload);
    }
    emitToRoom(room, event, payload) {
        this.server.to(room).emit(event, payload);
    }
    extractToken(client) {
        const header = client.handshake.auth?.token ?? client.handshake.headers.authorization;
        if (!header)
            throw new Error('No token provided');
        return header.startsWith('Bearer ') ? header.slice(7) : header;
    }
};
exports.EventsGateway = EventsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], EventsGateway.prototype, "server", void 0);
exports.EventsGateway = EventsGateway = EventsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], EventsGateway);
//# sourceMappingURL=events.gateway.js.map