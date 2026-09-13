"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditEntity = exports.AUDIT_ENTITY_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.AUDIT_ENTITY_KEY = 'audit:entityType';
const AuditEntity = (entityType) => (0, common_1.SetMetadata)(exports.AUDIT_ENTITY_KEY, entityType);
exports.AuditEntity = AuditEntity;
//# sourceMappingURL=audit-entity.decorator.js.map