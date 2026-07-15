import assert from "node:assert/strict";
import {
  InvoiceStatus,
  PaymentStatus,
  ReminderJobStatus,
  ReminderKind,
  SubscriptionStatus
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { addDays, startOfDay } from "@/lib/utils";
import { getReportingData } from "@/server/queries/reporting";
import { runReminderSweep } from "@/server/services/reminders";

async function main() {
  const now = new Date();
  const today = startOfDay(now);
  const suffix = `qa-${Date.now().toString().slice(-6)}`;

  let companyId: string | null = null;
  let contactId: string | null = null;
  let reminderRuleId: string | null = null;

  try {
    const template = await prisma.emailTemplate.findUnique({
      where: { key: "overdue_invoice" }
    });
    assert(template, "Expected overdue_invoice email template to exist.");

    const reminderRule = await prisma.reminderRule.create({
      data: {
        kind: ReminderKind.FAILED_PAYMENT,
        daysOffset: 0,
        templateKey: template.key,
        isActive: true
      }
    });
    reminderRuleId = reminderRule.id;

    const company = await prisma.company.create({
      data: {
        name: `Automation QA ${suffix}`,
        legalName: `Automation QA ${suffix} Ltd`,
        billingEmail: `${suffix}@example.com`,
        billingPhone: "+44 113 555 0101",
        tags: ["qa", "automation"]
      }
    });
    companyId = company.id;

    const contact = await prisma.contact.create({
      data: {
        companyId: company.id,
        firstName: "QA",
        lastName: "Automation",
        email: `${suffix}@example.com`,
        isPrimary: true
      }
    });
    contactId = contact.id;

    const [activeSubscription, pausedSubscription, cancelledSubscription] = await Promise.all([
      prisma.subscription.create({
        data: {
          companyId: company.id,
          contactId: contact.id,
          serviceName: `Active Renewal ${suffix}`,
          description: "Active recurring service for automation QA.",
          status: SubscriptionStatus.ACTIVE,
          frequency: "MONTHLY",
          intervalCount: 1,
          amount: 120,
          taxRate: 20,
          startDate: today,
          nextBillingDate: today,
          reminderOffsets: [0],
          autoGenerateInvoice: true,
          autoSendReminders: false
        }
      }),
      prisma.subscription.create({
        data: {
          companyId: company.id,
          contactId: contact.id,
          serviceName: `Paused Renewal ${suffix}`,
          description: "Paused recurring service for automation QA.",
          status: SubscriptionStatus.PAUSED,
          frequency: "MONTHLY",
          intervalCount: 1,
          amount: 95,
          taxRate: 20,
          startDate: today,
          nextBillingDate: today,
          reminderOffsets: [0],
          autoGenerateInvoice: true,
          autoSendReminders: false
        }
      }),
      prisma.subscription.create({
        data: {
          companyId: company.id,
          contactId: contact.id,
          serviceName: `Cancelled Renewal ${suffix}`,
          description: "Cancelled recurring service for automation QA.",
          status: SubscriptionStatus.CANCELLED,
          frequency: "MONTHLY",
          intervalCount: 1,
          amount: 80,
          taxRate: 20,
          startDate: today,
          nextBillingDate: today,
          reminderOffsets: [0],
          autoGenerateInvoice: true,
          autoSendReminders: false,
          cancelledAt: today
        }
      })
    ]);

    const reportBefore = await getReportingData(now);

    const partialInvoice = await prisma.invoice.create({
      data: {
        companyId: company.id,
        contactId: contact.id,
        number: `QA-PARTIAL-${suffix}`,
        status: InvoiceStatus.SENT,
        currency: "GBP",
        issueDate: today,
        dueDate: addDays(today, 14),
        subtotalAmount: 200,
        taxAmount: 40,
        discountAmount: 0,
        totalAmount: 240,
        balanceDue: 240,
        paymentReference: `QA-PARTIAL-${suffix}`,
        items: {
          create: [
            {
              description: "Partial-payment reporting QA",
              quantity: 1,
              unitPrice: 200,
              taxRate: 20,
              discountAmount: 0,
              lineTotal: 200,
              sortOrder: 1
            }
          ]
        }
      }
    });

    await prisma.payment.create({
      data: {
        invoiceId: partialInvoice.id,
        status: PaymentStatus.COMPLETED,
        paidAt: now,
        amount: 80,
        method: "Bank transfer",
        reference: `PARTIAL-${suffix}`
      }
    });

    await prisma.invoice.update({
      where: { id: partialInvoice.id },
      data: {
        balanceDue: 160,
        status: InvoiceStatus.PARTIAL
      }
    });

    const reportAfter = await getReportingData(now);
    const collectionsDelta = Number((reportAfter.metrics.collectionsThisMonth - reportBefore.metrics.collectionsThisMonth).toFixed(2));
    assert.equal(collectionsDelta, 80, "Collections reporting should move by the completed payment amount, not the invoice total.");

    const failedInvoice = await prisma.invoice.create({
      data: {
        companyId: company.id,
        contactId: contact.id,
        number: `QA-FAILED-${suffix}`,
        status: InvoiceStatus.SENT,
        currency: "GBP",
        issueDate: today,
        dueDate: addDays(today, 7),
        subtotalAmount: 100,
        taxAmount: 20,
        discountAmount: 0,
        totalAmount: 120,
        balanceDue: 120,
        paymentReference: `QA-FAILED-${suffix}`,
        items: {
          create: [
            {
              description: "Failed payment reminder QA",
              quantity: 1,
              unitPrice: 100,
              taxRate: 20,
              discountAmount: 0,
              lineTotal: 100,
              sortOrder: 1
            }
          ]
        }
      }
    });

    const recoveredInvoice = await prisma.invoice.create({
      data: {
        companyId: company.id,
        contactId: contact.id,
        number: `QA-RECOVERED-${suffix}`,
        status: InvoiceStatus.SENT,
        currency: "GBP",
        issueDate: today,
        dueDate: addDays(today, 7),
        subtotalAmount: 100,
        taxAmount: 20,
        discountAmount: 0,
        totalAmount: 120,
        balanceDue: 120,
        paymentReference: `QA-RECOVERED-${suffix}`,
        items: {
          create: [
            {
              description: "Recovered payment reminder QA",
              quantity: 1,
              unitPrice: 100,
              taxRate: 20,
              discountAmount: 0,
              lineTotal: 100,
              sortOrder: 1
            }
          ]
        }
      }
    });

    const failedPayment = await prisma.payment.create({
      data: {
        invoiceId: failedInvoice.id,
        status: PaymentStatus.FAILED,
        paidAt: now,
        amount: 120,
        method: "Card",
        reference: `FAILED-${suffix}`
      }
    });

    const recoveredFailedPayment = await prisma.payment.create({
      data: {
        invoiceId: recoveredInvoice.id,
        status: PaymentStatus.FAILED,
        paidAt: now,
        amount: 120,
        method: "Card",
        reference: `FAILED-RECOVERED-${suffix}`
      }
    });

    await prisma.payment.create({
      data: {
        invoiceId: recoveredInvoice.id,
        status: PaymentStatus.COMPLETED,
        paidAt: now,
        amount: 10,
        method: "Card",
        reference: `RECOVERED-${suffix}`
      }
    });

    await prisma.invoice.update({
      where: { id: recoveredInvoice.id },
      data: {
        balanceDue: 110,
        status: InvoiceStatus.PARTIAL,
        paidAt: null
      }
    });

    await runReminderSweep(now);

    const refreshedActiveSubscription = await prisma.subscription.findUniqueOrThrow({
      where: { id: activeSubscription.id },
      include: { invoices: true }
    });
    const refreshedPausedSubscription = await prisma.subscription.findUniqueOrThrow({
      where: { id: pausedSubscription.id },
      include: { invoices: true }
    });
    const refreshedCancelledSubscription = await prisma.subscription.findUniqueOrThrow({
      where: { id: cancelledSubscription.id },
      include: { invoices: true }
    });

    assert.equal(refreshedActiveSubscription.invoices.length, 1, "Active subscriptions should generate exactly one renewal invoice for today.");
    assert.equal(refreshedPausedSubscription.invoices.length, 0, "Paused subscriptions should not generate renewal invoices.");
    assert.equal(refreshedCancelledSubscription.invoices.length, 0, "Cancelled subscriptions should not generate renewal invoices.");
    assert(refreshedActiveSubscription.nextBillingDate > today, "Active subscription should advance to the next billing date.");

    const reminderJobs = await prisma.reminderJob.findMany({
      where: {
        invoiceId: {
          in: [failedInvoice.id, recoveredInvoice.id]
        }
      },
      orderBy: { createdAt: "asc" }
    });

    const failedJob = reminderJobs.find((job) => job.idempotencyKey.includes(failedPayment.id));
    const recoveredJob = reminderJobs.find((job) => job.idempotencyKey.includes(recoveredFailedPayment.id));

    assert(failedJob, "Expected a failed-payment reminder job for the unrecovered invoice.");
    assert(recoveredJob, "Expected a failed-payment reminder job for the recovered invoice.");
    assert.equal(failedJob.status, ReminderJobStatus.SENT, "Unrecovered failed payment should send a follow-up reminder.");
    assert.equal(recoveredJob.status, ReminderJobStatus.SKIPPED, "Recovered failed payment should be skipped during the sweep.");

    const sentLog = await prisma.emailLog.findFirst({
      where: {
        reminderJobId: failedJob.id,
        templateKey: "overdue_invoice",
        status: "SENT"
      }
    });
    assert(sentLog, "Expected a sent email log for the failed-payment recovery reminder.");

    console.log("QA automation checks passed.");
  } finally {
    if (companyId) {
      const invoices = await prisma.invoice.findMany({
        where: { companyId },
        select: { id: true }
      });
      const invoiceIds = invoices.map((invoice) => invoice.id);

      const subscriptions = await prisma.subscription.findMany({
        where: { companyId },
        select: { id: true }
      });
      const subscriptionIds = subscriptions.map((subscription) => subscription.id);

      if (invoiceIds.length) {
        await prisma.emailLog.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
        await prisma.reminderJob.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
        await prisma.communicationLog.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
        await prisma.payment.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
        await prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      }

      if (subscriptionIds.length) {
        await prisma.emailLog.deleteMany({ where: { subscriptionId: { in: subscriptionIds } } });
        await prisma.reminderJob.deleteMany({ where: { subscriptionId: { in: subscriptionIds } } });
        await prisma.communicationLog.deleteMany({ where: { subscriptionId: { in: subscriptionIds } } });
        await prisma.subscriptionEvent.deleteMany({ where: { subscriptionId: { in: subscriptionIds } } });
      }

      await prisma.auditLog.deleteMany({
        where: {
          OR: [
            { summary: { contains: suffix } },
            { entityId: companyId },
            contactId
              ? { entityId: contactId }
              : undefined,
            ...(invoiceIds.length ? [{ entityId: { in: invoiceIds } }] : []),
            ...(subscriptionIds.length ? [{ entityId: { in: subscriptionIds } }] : [])
          ].filter(Boolean) as Array<Record<string, unknown>>
        }
      });

      await prisma.invoice.deleteMany({ where: { companyId } });
      await prisma.subscription.deleteMany({ where: { companyId } });
      await prisma.contact.deleteMany({ where: { companyId } });
      await prisma.company.delete({ where: { id: companyId } });
    }

    if (reminderRuleId) {
      await prisma.reminderRule.deleteMany({ where: { id: reminderRuleId } });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
