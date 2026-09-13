"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const modules_constant_1 = require("../src/common/constants/modules.constant");
const roles_constant_1 = require("../src/common/constants/roles.constant");
const prisma = new client_1.PrismaClient();
const BOOTSTRAP_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@enterprise.local';
const BOOTSTRAP_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
async function seedPermissions() {
    const actions = Object.values(client_1.PermissionAction);
    for (const moduleSlug of modules_constant_1.MODULES) {
        for (const action of actions) {
            await prisma.permission.upsert({
                where: { module_action: { module: moduleSlug, action } },
                update: {},
                create: {
                    module: moduleSlug,
                    action,
                    description: `${action} ${moduleSlug}`,
                },
            });
        }
    }
    console.log(`Seeded ${modules_constant_1.MODULES.length * actions.length} permissions.`);
}
async function seedRoles() {
    for (const roleName of roles_constant_1.SYSTEM_ROLES) {
        await prisma.role.upsert({
            where: { name: roleName },
            update: {},
            create: {
                name: roleName,
                isSystem: true,
                description: `${roleName} (system role)`,
            },
        });
    }
    console.log(`Seeded ${roles_constant_1.SYSTEM_ROLES.length} system roles.`);
}
async function grantAdminAllPermissions() {
    const adminRole = await prisma.role.findUniqueOrThrow({
        where: { name: 'Admin' },
    });
    const allPermissions = await prisma.permission.findMany();
    await prisma.rolePermission.createMany({
        data: allPermissions.map((permission) => ({
            roleId: adminRole.id,
            permissionId: permission.id,
        })),
        skipDuplicates: true,
    });
    console.log(`Granted Admin role all ${allPermissions.length} permissions.`);
}
async function seedBootstrapAdmin() {
    const existing = await prisma.user.findUnique({
        where: { email: BOOTSTRAP_ADMIN_EMAIL },
    });
    if (existing) {
        if (!existing.isSystemAccount) {
            await prisma.user.update({
                where: { id: existing.id },
                data: { isSystemAccount: true },
            });
            console.log(`Marked existing bootstrap admin ${BOOTSTRAP_ADMIN_EMAIL} as a system account.`);
        }
        else {
            console.log(`Bootstrap admin ${BOOTSTRAP_ADMIN_EMAIL} already exists — skipping.`);
        }
        return;
    }
    const adminRole = await prisma.role.findUniqueOrThrow({
        where: { name: 'Admin' },
    });
    const passwordHash = await bcrypt.hash(BOOTSTRAP_ADMIN_PASSWORD, 12);
    await prisma.user.create({
        data: {
            email: BOOTSTRAP_ADMIN_EMAIL,
            passwordHash,
            firstName: 'System',
            lastName: 'Admin',
            isSystemAccount: true,
            roles: { create: [{ roleId: adminRole.id }] },
        },
    });
    console.log(`Created bootstrap admin ${BOOTSTRAP_ADMIN_EMAIL} — CHANGE THIS PASSWORD IMMEDIATELY.`);
}
async function main() {
    await seedPermissions();
    await seedRoles();
    await grantAdminAllPermissions();
    await seedBootstrapAdmin();
}
main()
    .catch((error) => {
    console.error(error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map