import { loadEnvConfig } from "@next/env";
import bcrypt from "bcryptjs";
import { BillingFrequency, PaymentStatus, PrismaClient, ReminderKind, SubscriptionStatus, UserStatus } from "@prisma/client";
import { runReminderSweep } from "@/server/services/reminders";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

const permissions = [
  ["dashboard.view", "View dashboard"],
  ["customers.view", "View customers"],
  ["customers.manage", "Manage customers"],
  ["companies.view", "View companies"],
  ["companies.manage", "Manage companies"],
  ["quotes.view", "View quotes"],
  ["quotes.manage", "Create and convert quotes"],
  ["invoices.view", "View invoices"],
  ["invoices.manage", "Create and edit invoices"],
  ["invoices.send", "Send invoices"],
  ["payments.manage", "Track payments"],
  ["subscriptions.view", "View subscriptions"],
  ["subscriptions.manage", "Manage subscriptions"],
  ["tasks.view", "View tasks"],
  ["tasks.manage", "Manage tasks"],
  ["settings.view", "View settings"],
  ["settings.manage", "Manage settings"],
  ["users.view", "View users"],
  ["users.manage", "Manage users"],
  ["reports.view", "View reports"],
  ["notifications.view", "View notifications"],
  ["audit.view", "View audit log"]
] as const;

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

async function seedSampleBusinessSubscriptions(ownerUserId?: string | null) {
  const today = startOfDay();
  const sampleSubscriptions = [
    {
      vendorName: "AWS",
      serviceName: "Production Hosting",
      category: "Hosting",
      supportEmail: "support@aws.amazon.com",
      accountNumber: "AWS-88421",
      status: SubscriptionStatus.ACTIVE,
      frequency: BillingFrequency.MONTHLY,
      intervalCount: 1,
      amount: 185.4,
      currency: "GBP",
      nextPaymentDate: addDays(today, 21),
      renewalDate: addDays(today, 21),
      autoNotify: true,
      reminderDaysBefore: [14, 7, 3, 0],
      paymentMethod: "Direct debit",
      reference: "aws-prod-hosting",
      website: "https://console.aws.amazon.com",
      notes: "Primary hosting stack for production workloads.",
      payments: [
        { amount: 185.4, paidAt: addDays(today, -10), status: PaymentStatus.COMPLETED, method: "Direct debit", reference: "aws-mar" },
        { amount: 182.15, paidAt: addDays(today, -40), status: PaymentStatus.COMPLETED, method: "Direct debit", reference: "aws-feb" }
      ]
    },
    {
      vendorName: "Adobe",
      serviceName: "Creative Cloud Team",
      category: "Software",
      supportEmail: "enterprise@adobe.com",
      accountNumber: "ADB-22114",
      status: SubscriptionStatus.ACTIVE,
      frequency: BillingFrequency.MONTHLY,
      intervalCount: 1,
      amount: 62.99,
      currency: "GBP",
      nextPaymentDate: addDays(today, 3),
      renewalDate: addDays(today, 3),
      autoNotify: true,
      reminderDaysBefore: [14, 7, 3, 0],
      paymentMethod: "Company card",
      reference: "adobe-cc-team",
      website: "https://adminconsole.adobe.com",
      notes: "Design and asset production licenses.",
      payments: [
        { amount: 62.99, paidAt: addDays(today, -28), status: PaymentStatus.COMPLETED, method: "Company card", reference: "adobe-feb" },
        { amount: 62.99, paidAt: addDays(today, -58), status: PaymentStatus.COMPLETED, method: "Company card", reference: "adobe-jan" }
      ]
    },
    {
      vendorName: "Slack",
      serviceName: "Team Messaging",
      category: "Communication",
      supportEmail: "feedback@slack.com",
      accountNumber: "SLK-67110",
      status: SubscriptionStatus.ACTIVE,
      frequency: BillingFrequency.MONTHLY,
      intervalCount: 1,
      amount: 54,
      currency: "GBP",
      nextPaymentDate: addDays(today, 7),
      renewalDate: addDays(today, 7),
      autoNotify: true,
      reminderDaysBefore: [14, 7, 3, 0],
      paymentMethod: "Company card",
      reference: "slack-standard",
      website: "https://app.slack.com",
      notes: "Internal messaging and client war rooms.",
      payments: [
        { amount: 54, paidAt: addDays(today, -24), status: PaymentStatus.COMPLETED, method: "Company card", reference: "slack-mar" },
        { amount: 54, paidAt: addDays(today, -54), status: PaymentStatus.COMPLETED, method: "Company card", reference: "slack-feb" }
      ]
    },
    {
      vendorName: "123 Reg",
      serviceName: "Domain Portfolio",
      category: "Domains",
      supportEmail: "support@123-reg.co.uk",
      accountNumber: "DOM-31415",
      status: SubscriptionStatus.ACTIVE,
      frequency: BillingFrequency.QUARTERLY,
      intervalCount: 1,
      amount: 48,
      currency: "GBP",
      nextPaymentDate: addDays(today, 14),
      renewalDate: addDays(today, 14),
      autoNotify: true,
      reminderDaysBefore: [30, 14, 7, 3],
      paymentMethod: "Direct debit",
      reference: "domains-quarterly",
      website: "https://www.123-reg.co.uk",
      notes: "Domains and DNS renewals across client microsites.",
      payments: [
        { amount: 48, paidAt: addDays(today, -76), status: PaymentStatus.COMPLETED, method: "Direct debit", reference: "domains-q1" },
        { amount: 46, paidAt: addDays(today, -168), status: PaymentStatus.COMPLETED, method: "Direct debit", reference: "domains-q4" }
      ]
    },
    {
      vendorName: "Hiscox",
      serviceName: "Business Insurance",
      category: "Insurance",
      supportEmail: "customerservices@hiscox.com",
      accountNumber: "INS-51002",
      status: SubscriptionStatus.ACTIVE,
      frequency: BillingFrequency.ANNUALLY,
      intervalCount: 1,
      amount: 624,
      currency: "GBP",
      nextPaymentDate: today,
      renewalDate: today,
      autoNotify: true,
      reminderDaysBefore: [30, 14, 7, 3, 0],
      paymentMethod: "Direct debit",
      reference: "hiscox-annual",
      website: "https://www.hiscox.co.uk",
      notes: "Professional indemnity and business cover.",
      payments: [
        { amount: 598, paidAt: addDays(today, -364), status: PaymentStatus.COMPLETED, method: "Direct debit", reference: "hiscox-2025" }
      ]
    }
  ] as const;

  for (const sample of sampleSubscriptions) {
    const subscription = await prisma.businessSubscription.create({
      data: {
        vendorName: sample.vendorName,
        serviceName: sample.serviceName,
        category: sample.category,
        supportEmail: sample.supportEmail,
        accountNumber: sample.accountNumber,
        renewalOwnerUserId: ownerUserId ?? null,
        status: sample.status,
        frequency: sample.frequency,
        intervalCount: sample.intervalCount,
        amount: sample.amount,
        currency: sample.currency,
        nextPaymentDate: sample.nextPaymentDate,
        renewalDate: sample.renewalDate,
        autoNotify: sample.autoNotify,
        reminderDaysBefore: [...sample.reminderDaysBefore],
        paymentMethod: sample.paymentMethod,
        reference: sample.reference,
        website: sample.website,
        notes: sample.notes
      }
    });

    await prisma.businessSubscriptionPayment.createMany({
      data: sample.payments.map((payment) => ({
        businessSubscriptionId: subscription.id,
        recordedByUserId: ownerUserId ?? null,
        status: payment.status,
        paidAt: payment.paidAt,
        amount: payment.amount,
        currency: sample.currency,
        method: payment.method,
        reference: payment.reference
      }))
    });
  }
}

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.businessSubscriptionPayment.deleteMany();
  await prisma.businessSubscription.deleteMany();
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
  await prisma.reminderRule.deleteMany();
  await prisma.emailTemplate.deleteMany();
  await prisma.address.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  const permissionRecords = await Promise.all(
    permissions.map(([key, name]) =>
      prisma.permission.create({
        data: {
          key,
          name,
          description: name
        }
      })
    )
  );

  const permissionMap = new Map(permissionRecords.map((permission) => [permission.key, permission.id]));

  async function createRole(key: string, name: string, permissionKeys: string[]) {
    return prisma.role.create({
      data: {
        key,
        name,
        permissions: {
          create: permissionKeys.map((permissionKey) => ({
            permissionId: permissionMap.get(permissionKey)!
          }))
        }
      }
    });
  }

  const adminRole = await createRole("admin", "Admin", permissionRecords.map((permission) => permission.key));
  await createRole("staff", "Staff", [
    "dashboard.view",
    "customers.view",
    "customers.manage",
    "companies.view",
    "companies.manage",
    "quotes.view",
    "quotes.manage",
    "invoices.view",
    "invoices.manage",
    "tasks.view",
    "tasks.manage",
    "notifications.view"
  ]);
  await createRole("finance", "Finance", [
    "dashboard.view",
    "customers.view",
    "companies.view",
    "quotes.view",
    "quotes.manage",
    "invoices.view",
    "invoices.manage",
    "invoices.send",
    "payments.manage",
    "subscriptions.view",
    "subscriptions.manage",
    "reports.view",
    "notifications.view"
  ]);
  await createRole("read_only", "Read-only", [
    "dashboard.view",
    "customers.view",
    "companies.view",
    "quotes.view",
    "invoices.view",
    "subscriptions.view",
    "tasks.view",
    "reports.view",
    "notifications.view"
  ]);

  await prisma.emailTemplate.createMany({
    data: [
      {
        key: "new_invoice",
        name: "New invoice",
        subject: "Invoice {{invoice.number}} from {{business.name}}",
        bodyHtml:
          "<p>Hello {{contact.firstName}},</p><p>Your invoice {{invoice.number}} is ready. The total due is {{invoice.totalAmount}}.</p><p>Please reply if you need anything else.</p>",
        bodyText:
          "Hello {{contact.firstName}}, your invoice {{invoice.number}} is ready. The total due is {{invoice.totalAmount}}."
      },
      {
        key: "invoice_reminder",
        name: "Invoice reminder",
        subject: "Reminder: invoice {{invoice.number}} is due soon",
        bodyHtml:
          "<p>Hello {{contact.firstName}},</p><p>This is a reminder that invoice {{invoice.number}} is due on {{invoice.dueDate}}.</p>",
        bodyText: "Reminder: invoice {{invoice.number}} is due on {{invoice.dueDate}}."
      },
      {
        key: "overdue_invoice",
        name: "Overdue invoice",
        subject: "Invoice {{invoice.number}} is overdue",
        bodyHtml:
          "<p>Hello {{contact.firstName}},</p><p>Invoice {{invoice.number}} is overdue. The outstanding balance is {{invoice.balanceDue}}.</p>",
        bodyText: "Invoice {{invoice.number}} is overdue. Outstanding balance: {{invoice.balanceDue}}."
      },
      {
        key: "renewal_reminder",
        name: "Renewal reminder",
        subject: "Renewal approaching for {{subscription.serviceName}}",
        bodyHtml:
          "<p>Hello {{contact.firstName}},</p><p>Your renewal for {{subscription.serviceName}} is approaching on {{subscription.nextBillingDate}}.</p>",
        bodyText: "Your renewal for {{subscription.serviceName}} is approaching on {{subscription.nextBillingDate}}."
      },
      {
        key: "payment_received",
        name: "Payment received",
        subject: "Payment received for invoice {{invoice.number}}",
        bodyHtml: "<p>Hello {{contact.firstName}},</p><p>We have received your payment. Thank you.</p>",
        bodyText: "We have received your payment. Thank you."
      }
    ]
  });

  await prisma.reminderRule.createMany({
    data: [
      { kind: ReminderKind.SUBSCRIPTION_RENEWAL, daysOffset: 14, templateKey: "renewal_reminder" },
      { kind: ReminderKind.SUBSCRIPTION_RENEWAL, daysOffset: 7, templateKey: "renewal_reminder" },
      { kind: ReminderKind.INVOICE_DUE_TODAY, daysOffset: 0, templateKey: "invoice_reminder" },
      { kind: ReminderKind.INVOICE_OVERDUE, daysOffset: -3, templateKey: "overdue_invoice" },
      { kind: ReminderKind.INVOICE_OVERDUE, daysOffset: -7, templateKey: "overdue_invoice" }
    ]
  });

  await prisma.setting.createMany({
    data: [
      {
        category: "business",
        key: "profile",
        value: {
          name: process.env.BUSINESS_NAME ?? "Appathy CRM",
          email: process.env.BUSINESS_EMAIL ?? "billing@appathy.uk",
          phone: process.env.BUSINESS_PHONE ?? "+44 20 7946 0012",
          address: process.env.BUSINESS_ADDRESS ?? "77 Billing Lane, Leeds, LS1 4AB, United Kingdom",
          registrationNumber: process.env.BUSINESS_REGISTRATION ?? "Company No. 12000001",
          vatNumber: process.env.BUSINESS_VAT_NUMBER ?? "GB123456789"
        }
      },
      {
        category: "billing",
        key: "defaults",
        value: {
          invoicePrefix: process.env.INVOICE_PREFIX ?? "APP",
          defaultCurrency: process.env.DEFAULT_CURRENCY ?? "GBP",
          defaultTaxRate: Number(process.env.DEFAULT_TAX_RATE ?? 20),
          paymentTermsDays: Number(process.env.PAYMENT_TERMS_DAYS ?? 14),
          paymentDetails: process.env.PAYMENT_DETAILS ?? "Bank transfer details not configured yet."
        }
      },
      {
        category: "reminders",
        key: "defaults",
        value: {
          renewalOffsets: [14, 7, 0],
          overdueOffsets: [3, 7, 14],
          sendInternalAlerts: true
        }
      }
    ]
  });

  const bootstrapEmail = process.env.CRM_BOOTSTRAP_ADMIN_EMAIL?.trim();
  const bootstrapPassword = process.env.CRM_BOOTSTRAP_ADMIN_PASSWORD?.trim();

  let bootstrapAdminUserId: string | null = null;

  if (bootstrapEmail || bootstrapPassword) {
    if (!bootstrapEmail || !bootstrapPassword) {
      throw new Error("CRM_BOOTSTRAP_ADMIN_EMAIL and CRM_BOOTSTRAP_ADMIN_PASSWORD must both be set together.");
    }

    const passwordHash = await bcrypt.hash(bootstrapPassword, 12);
    const user = await prisma.user.create({
      data: {
        firstName: process.env.CRM_BOOTSTRAP_ADMIN_FIRST_NAME?.trim() || "CRM",
        lastName: process.env.CRM_BOOTSTRAP_ADMIN_LAST_NAME?.trim() || "Administrator",
        email: bootstrapEmail,
        passwordHash,
        status: UserStatus.ACTIVE,
        jobTitle: process.env.CRM_BOOTSTRAP_ADMIN_JOB_TITLE?.trim() || "System Administrator",
        userRoles: {
          create: [{ roleId: adminRole.id }]
        }
      }
    });
    bootstrapAdminUserId = user.id;
  }

  const includeSampleData = process.env.CRM_INCLUDE_SAMPLE_DATA === "true";
  if (includeSampleData) {
    await seedSampleBusinessSubscriptions(bootstrapAdminUserId);

    if (bootstrapAdminUserId) {
      await runReminderSweep();
    }
  }

  console.log("CRM seed complete.");
  if (bootstrapEmail) {
    console.log(`Bootstrap admin created: ${bootstrapEmail}`);
  } else {
    console.log("No bootstrap admin created. Set CRM_BOOTSTRAP_ADMIN_EMAIL and CRM_BOOTSTRAP_ADMIN_PASSWORD before seeding if you need one.");
  }
  if (includeSampleData) {
    console.log("Sample outgoing subscriptions and payments created.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
