import { loadEnvConfig } from "@next/env";
import { PrismaClient, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

export const E2E_ADMIN_EMAIL = process.env.CRM_E2E_ADMIN_EMAIL?.trim().toLowerCase() || "e2e-admin@appathy.local";
export const E2E_ADMIN_PASSWORD = process.env.CRM_E2E_ADMIN_PASSWORD?.trim() || "ChangeMe123!";
export const E2E_VENDOR_PREFIX = "[E2E] Outgoings QA";
export const E2E_SERVICE_PREFIX = "[E2E] Business Cost";

export async function ensureE2EAdmin() {
  const adminRole = await prisma.role.findUnique({
    where: { key: "admin" }
  });

  if (!adminRole) {
    throw new Error("Admin role not found. Seed the database before running Playwright QA.");
  }

  const passwordHash = await bcrypt.hash(E2E_ADMIN_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: E2E_ADMIN_EMAIL },
    update: {
      firstName: "E2E",
      lastName: "Admin",
      passwordHash,
      status: UserStatus.ACTIVE,
      jobTitle: "QA Automation"
    },
    create: {
      firstName: "E2E",
      lastName: "Admin",
      email: E2E_ADMIN_EMAIL,
      passwordHash,
      status: UserStatus.ACTIVE,
      jobTitle: "QA Automation",
      userRoles: {
        create: [{ roleId: adminRole.id }]
      }
    }
  });

  const hasAdminRole = await prisma.userRole.findFirst({
    where: {
      userId: user.id,
      roleId: adminRole.id
    },
    select: { userId: true }
  });

  if (!hasAdminRole) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: adminRole.id
      }
    });
  }

  await prisma.session.deleteMany({
    where: { userId: user.id }
  });

  return user;
}

export async function cleanupOutgoingsQaArtifacts() {
  const subscriptions = await prisma.businessSubscription.findMany({
    where: {
      vendorName: {
        startsWith: E2E_VENDOR_PREFIX
      }
    },
    select: { id: true }
  });

  const subscriptionIds = subscriptions.map((subscription) => subscription.id);

  if (subscriptionIds.length) {
    await prisma.auditLog.deleteMany({
      where: {
        entityType: "business_subscription",
        entityId: { in: subscriptionIds }
      }
    });

    await prisma.businessSubscription.deleteMany({
      where: {
        id: { in: subscriptionIds }
      }
    });
  }

  await prisma.notification.deleteMany({
    where: {
      OR: [
        { title: { contains: E2E_VENDOR_PREFIX } },
        { body: { contains: E2E_VENDOR_PREFIX } },
        { body: { contains: E2E_SERVICE_PREFIX } }
      ]
    }
  });
}

export async function disconnectOutgoingsE2EPrisma() {
  await prisma.$disconnect();
}
