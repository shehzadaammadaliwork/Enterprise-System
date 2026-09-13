/// One-time (idempotent) database seed: the fixed RBAC permission catalog,
/// the fixed set of system roles, an Admin role with every permission, and
/// a single bootstrap Admin user so there's a way to log in and start
/// assigning roles through the API. Re-running is safe — everything uses
/// upsert/skipDuplicates.
import { PrismaClient, PermissionAction } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { MODULES } from '../src/common/constants/modules.constant';
import { SYSTEM_ROLES } from '../src/common/constants/roles.constant';

const prisma = new PrismaClient();

const BOOTSTRAP_ADMIN_EMAIL =
  process.env.SEED_ADMIN_EMAIL ?? 'admin@enterprise.local';
const BOOTSTRAP_ADMIN_PASSWORD =
  process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';

async function seedPermissions() {
  const actions = Object.values(PermissionAction);
  for (const moduleSlug of MODULES) {
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
  console.log(`Seeded ${MODULES.length * actions.length} permissions.`);
}

async function seedRoles() {
  for (const roleName of SYSTEM_ROLES) {
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
  console.log(`Seeded ${SYSTEM_ROLES.length} system roles.`);
}

/// Admin gets every permission in the catalog. Every other system role
/// starts with none — an Admin assigns permissions per role via the RBAC
/// endpoints once the org's actual policy is decided.
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
    // Backfill for environments seeded before isSystemAccount existed —
    // this account must always carry the flag, re-seed or not.
    if (!existing.isSystemAccount) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { isSystemAccount: true },
      });
      console.log(
        `Marked existing bootstrap admin ${BOOTSTRAP_ADMIN_EMAIL} as a system account.`,
      );
    } else {
      console.log(
        `Bootstrap admin ${BOOTSTRAP_ADMIN_EMAIL} already exists — skipping.`,
      );
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

  console.log(
    `Created bootstrap admin ${BOOTSTRAP_ADMIN_EMAIL} — CHANGE THIS PASSWORD IMMEDIATELY.`,
  );
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
