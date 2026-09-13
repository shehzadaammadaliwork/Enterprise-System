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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogInterceptor = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const rxjs_1 = require("rxjs");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_entity_decorator_1 = require("../decorators/audit-entity.decorator");
const events_gateway_1 = require("../websocket/events.gateway");
const DASHBOARD_SECTIONS_BY_MODULE = {
    attendance: ['hr'],
    'leave-requests': ['hr'],
    employees: ['hr'],
    payroll: ['hr'],
    crm: ['sales'],
    sales: ['sales', 'finance'],
    finance: ['finance'],
};
const METHOD_TO_ACTION = {
    POST: client_1.AuditAction.CREATE,
    PUT: client_1.AuditAction.UPDATE,
    PATCH: client_1.AuditAction.UPDATE,
    DELETE: client_1.AuditAction.DELETE,
};
const SENSITIVE_AUDIT_FIELD_NAMES = new Set([
    'salary',
    'gross',
    'deductions',
    'net',
    'twofactorsecret',
    'passwordhash',
    'password',
    'refreshtoken',
    'accountnumber',
    'plaintextkey',
    'keyhash',
]);
const REDACTED = '[REDACTED]';
function redactSensitiveFields(value, seen = new WeakSet()) {
    if (Array.isArray(value)) {
        return value.map((item) => redactSensitiveFields(item, seen));
    }
    if (value && typeof value === 'object') {
        if (seen.has(value))
            return value;
        seen.add(value);
        const result = {};
        for (const [key, val] of Object.entries(value)) {
            result[key] = SENSITIVE_AUDIT_FIELD_NAMES.has(key.toLowerCase())
                ? REDACTED
                : redactSensitiveFields(val, seen);
        }
        return result;
    }
    return value;
}
let AuditLogInterceptor = class AuditLogInterceptor {
    prisma;
    reflector;
    eventsGateway;
    constructor(prisma, reflector, eventsGateway) {
        this.prisma = prisma;
        this.reflector = reflector;
        this.eventsGateway = eventsGateway;
    }
    intercept(context, next) {
        const request = context
            .switchToHttp()
            .getRequest();
        const action = METHOD_TO_ACTION[request.method];
        if (!action || request.path.startsWith('/api/v1/auth')) {
            return next.handle();
        }
        const moduleSlug = request.path.split('/').filter(Boolean)[2] ?? 'unknown';
        const entityType = this.reflector.get(audit_entity_decorator_1.AUDIT_ENTITY_KEY, context.getHandler()) ??
            context.getClass().name.replace(/Controller$/, '');
        return next.handle().pipe((0, rxjs_1.tap)((result) => {
            const data = result?.data ?? result;
            const entityId = request.params?.id ??
                (typeof data === 'object' && data && 'id' in data
                    ? data.id
                    : undefined);
            this.prisma.auditLog
                .create({
                data: {
                    userId: request.user?.id,
                    userEmail: request.user?.email,
                    action,
                    module: moduleSlug,
                    entityType,
                    entityId,
                    before: redactSensitiveFields(request.auditBefore),
                    after: action === client_1.AuditAction.DELETE
                        ? undefined
                        : redactSensitiveFields(data),
                    ip: request.ip,
                    method: request.method,
                    path: request.originalUrl,
                },
            })
                .catch(() => {
            });
            for (const section of DASHBOARD_SECTIONS_BY_MODULE[moduleSlug] ?? []) {
                this.eventsGateway.emitToAll('dashboard:update', { section });
            }
        }));
    }
};
exports.AuditLogInterceptor = AuditLogInterceptor;
exports.AuditLogInterceptor = AuditLogInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        core_1.Reflector,
        events_gateway_1.EventsGateway])
], AuditLogInterceptor);
//# sourceMappingURL=audit-log.interceptor.js.map