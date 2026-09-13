import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AUDIT_ENTITY_KEY } from '../decorators/audit-entity.decorator';
import { EventsGateway } from '../websocket/events.gateway';

/// Module 16's live-dashboard-updates requirement ("pushed via WebSockets,
/// not full page reloads") is satisfied here rather than by instrumenting
/// every business service individually — this interceptor already sees
/// every successful mutation and already derives `moduleSlug` from the
/// request path (see the comment on that below), so it's the natural
/// single place to also emit a lightweight "something in this area
/// changed, go refetch" signal. Same "generic infrastructure, no module
/// writes its own" philosophy as audit logging itself.
const DASHBOARD_SECTIONS_BY_MODULE: Record<string, string[]> = {
  attendance: ['hr'],
  'leave-requests': ['hr'],
  employees: ['hr'],
  payroll: ['hr'],
  crm: ['sales'],
  sales: ['sales', 'finance'],
  finance: ['finance'],
};

const METHOD_TO_ACTION: Record<string, AuditAction> = {
  POST: AuditAction.CREATE,
  PUT: AuditAction.UPDATE,
  PATCH: AuditAction.UPDATE,
  DELETE: AuditAction.DELETE,
};

/// Field names that are the DECRYPTED, plaintext counterpart of a column
/// FieldEncryptionService encrypts at rest (Employee.salaryEncrypted,
/// PayslipItem.{gross,deductions,net}Encrypted, User.twoFactorSecret), plus
/// a couple of universal credential names kept as defense-in-depth even
/// though no current response actually returns them. Without this, every
/// employee/payroll create or update would otherwise write these values in
/// plaintext into audit_logs permanently — a table with no field-level
/// encryption of its own and potentially broader read access than the
/// source records.
/// Gotcha: "gross"/"net"/"deductions" are generic enough that a future
/// Finance module (P&L figures) could reuse those names for data that
/// SHOULD stay visible in the audit trail. Module 10 (Finance) deliberately
/// avoided those names on Transaction (uses `amount` instead) for exactly
/// this reason. 'accountnumber' (BankAccount.accountNumber) is redacted too
/// — not encrypted at rest like salary, but kept out of the audit trail as
/// defense in depth.
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

function redactSensitiveFields(
  value: unknown,
  seen = new WeakSet<object>(),
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveFields(item, seen));
  }
  if (value && typeof value === 'object') {
    if (seen.has(value)) return value;
    seen.add(value);
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = SENSITIVE_AUDIT_FIELD_NAMES.has(key.toLowerCase())
        ? REDACTED
        : redactSensitiveFields(val, seen);
    }
    return result;
  }
  return value;
}

interface RequestWithAuditContext extends Request {
  user?: { id?: string; email?: string };
  /// Opt-in convention: a module's service can set `req.auditBefore = <old
  /// entity>` before mutating, so the generic interceptor can record a
  /// before/after diff without any module implementing its own logging.
  auditBefore?: unknown;
}

/// Global interceptor (Architecture Rule, Section 2): every mutating request
/// (POST/PUT/PATCH/DELETE) is written to audit_logs automatically. Auth
/// routes are excluded — logins/logouts/refreshes are tracked in
/// LoginHistory/Session instead, which is a more precise fit for that data.
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
    private readonly eventsGateway: EventsGateway,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithAuditContext>();
    const action = METHOD_TO_ACTION[request.method];

    if (!action || request.path.startsWith('/api/v1/auth')) {
      return next.handle();
    }

    const moduleSlug = request.path.split('/').filter(Boolean)[2] ?? 'unknown';
    const entityType =
      this.reflector.get<string>(AUDIT_ENTITY_KEY, context.getHandler()) ??
      context.getClass().name.replace(/Controller$/, '');

    return next.handle().pipe(
      tap((result) => {
        const data = (result as { data?: unknown })?.data ?? result;
        const entityId: string | undefined =
          (request.params?.id as string | undefined) ??
          (typeof data === 'object' && data && 'id' in data
            ? (data as { id: string }).id
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
              before: redactSensitiveFields(request.auditBefore) as
                Prisma.InputJsonValue | undefined,
              after:
                action === AuditAction.DELETE
                  ? undefined
                  : (redactSensitiveFields(data) as Prisma.InputJsonValue),
              ip: request.ip,
              method: request.method,
              path: request.originalUrl,
            },
          })
          .catch(() => {
            // Audit logging must never break the primary request flow.
          });

        for (const section of DASHBOARD_SECTIONS_BY_MODULE[moduleSlug] ?? []) {
          this.eventsGateway.emitToAll('dashboard:update', { section });
        }
      }),
    );
  }
}
