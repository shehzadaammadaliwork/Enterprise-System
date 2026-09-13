"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const STATUS_CODE_FALLBACK = {
    400: 'VALIDATION_ERROR',
    401: 'UNAUTHENTICATED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    429: 'RATE_LIMITED',
    500: 'INTERNAL_ERROR',
};
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    logger = new common_1.Logger(HttpExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const { status, error } = this.resolve(exception);
        if (status >= 500) {
            this.logger.error(`${request.method} ${request.url} -> ${status}`, exception?.stack);
        }
        response.status(status).json({ success: false, error });
    }
    resolve(exception) {
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const body = exception.getResponse();
            if (typeof body === 'object' && body !== null && 'code' in body) {
                const b = body;
                return {
                    status,
                    error: { code: b.code, message: this.flattenMessage(b.message) },
                };
            }
            const message = typeof body === 'object' && body !== null && 'message' in body
                ? body.message
                : exception.message;
            return {
                status,
                error: {
                    code: STATUS_CODE_FALLBACK[status] ?? 'ERROR',
                    message: this.flattenMessage(message),
                },
            };
        }
        if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (exception.code === 'P2002') {
                return {
                    status: common_1.HttpStatus.CONFLICT,
                    error: {
                        code: 'CONFLICT',
                        message: 'A record with these unique fields already exists.',
                    },
                };
            }
            if (exception.code === 'P2025') {
                return {
                    status: common_1.HttpStatus.NOT_FOUND,
                    error: { code: 'NOT_FOUND', message: 'Record not found.' },
                };
            }
        }
        if (this.isHttpErrorsShape(exception)) {
            return {
                status: exception.status,
                error: {
                    code: exception.code ?? STATUS_CODE_FALLBACK[exception.status] ?? 'ERROR',
                    message: exception.message,
                },
            };
        }
        return {
            status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred.',
            },
        };
    }
    flattenMessage(message) {
        return Array.isArray(message) ? message.join('; ') : message;
    }
    isHttpErrorsShape(exception) {
        return (typeof exception === 'object' &&
            exception !== null &&
            typeof exception.status === 'number' &&
            typeof exception.message === 'string');
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map