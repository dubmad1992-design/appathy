import bcrypt from "bcryptjs";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { PrismaClient, UserStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function ensureAdminAccess() {
  const targetEmail = (process.env.CRM_LIVE_ADMIN_EMAIL ?? "admin@crm.appathy.uk").trim().toLowerCase();
  const bootstrapPassword = process.env.CRM_LIVE_ADMIN_PASSWORD?.trim() || process.env.CRM_BOOTSTRAP_ADMIN_PASSWORD?.trim();

  const adminUsers = await prisma.user.findMany({
    where: {
      userRoles: {
        some: {
          role: {
            key: "admin"
          }
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  const existingTarget = adminUsers.find((user) => user.email.toLowerCase() === targetEmail);
  if (existingTarget) {
    return [existingTarget.id];
  }

  const sampleAdmin = adminUsers.find((user) => user.email.toLowerCase() === "admin@appathycrm.local");
  if (sampleAdmin) {
    const updated = await prisma.user.update({
      where: { id: sampleAdmin.id },
      data: {
        firstName: "CRM",
        lastName: "Administrator",
        email: targetEmail,
        jobTitle: "System Administrator",
        status: UserStatus.ACTIVE
      }
    });
    return [updated.id];
  }

  if (adminUsers[0]) {
    return adminUsers.map((user) => user.id);
  }

  if (!bootstrapPassword) {
    throw new Error(
      `No admin users exist. Set CRM_LIVE_ADMIN_PASSWORD or CRM_BOOTSTRAP_ADMIN_PASSWORD before running this cleanup so a bootstrap admin can be created for ${targetEmail}.`
    );
  }

  const adminRole = await prisma.role.findUnique({ where: { key: "admin" } });
  if (!adminRole) {
    throw new Error("Admin role is missing, so a bootstrap admin could not be created.");
  }

  const passwordHash = await bcrypt.hash(bootstrapPassword, 12);
  const created = await prisma.user.create({
    data: {
      firstName: "CRM",
      lastName: "Administrator",
      email: targetEmail,
      passwordHash,
      status: UserStatus.ACTIVE,
      jobTitle: "System Administrator",
      userRoles: {
        create: [{ roleId: adminRole.id }]
      }
    }
  });

  return [created.id];
}

async function clearUploadStorage() {
  const uploadRoot = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "./public/uploads");
  await rm(uploadRoot, { recursive: true, force: true });
  await mkdir(path.join(uploadRoot, "documents"), { recursive: true });
  await mkdir(path.join(uploadRoot, "invoices"), { recursive: true });
}

async function main() {
  const preservedAdminIds = await ensureAdminAccess();

  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.emailLog.deleteMany();
  await prisma.communicationLog.deleteMany();
  await prisma.document.deleteMany();
  await prisma.note.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.portalAccessToken.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.quoteItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.subscriptionEvent.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.reminderJob.deleteMany();
  await prisma.address.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany({
    where: {
      id: {
        notIn: preservedAdminIds
      }
    }
  });

  await clearUploadStorage();

  const [companyCount, userCount, invoiceCount, quoteCount, subscriptionCount] = await Promise.all([
    prisma.company.count(),
    prisma.user.count(),
    prisma.invoice.count(),
    prisma.quote.count(),
    prisma.subscription.count()
  ]);

  console.log(
    JSON.stringify(
      {
        ok: true,
        companyCount,
        userCount,
        invoiceCount,
        quoteCount,
        subscriptionCount
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
