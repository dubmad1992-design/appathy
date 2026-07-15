import {
  InvoiceStatus,
  PaymentStatus,
  ReminderJobStatus,
  ReminderKind,
  SubscriptionEventType,
  SubscriptionStatus
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { addDays, formatCurrency, formatDate, startOfDay } from "@/lib/utils";
import { renderTemplate, sendEmail } from "@/server/services/email";
import { logAudit } from "@/server/services/audit";
import { generateInvoiceNumber } from "@/server/services/invoice-number";
import { sendInvoiceDelivery } from "@/server/services/invoice-delivery";
import { advanceBillingDate } from "@/server/services/subscription-billing";

function getPositiveOffset(daysOffset: number) {
  return Math.abs(daysOffset);
}

function getScheduledDateForRule(baseDate: Date, kind: ReminderKind, daysOffset: number) {
  const base = startOfDay(baseDate);

  switch (kind) {
    case ReminderKind.INVOICE_PRE_DUE:
    case ReminderKind.SUBSCRIPTION_RENEWAL:
    case ReminderKind.INTERNAL_ALERT:
      return addDays(base, -getPositiveOffset(daysOffset));
    case ReminderKind.INVOICE_DUE_TODAY:
      return base;
    case ReminderKind.INVOICE_OVERDUE:
    case ReminderKind.FAILED_PAYMENT:
      return addDays(base, getPositiveOffset(daysOffset));
    default:
      return base;
  }
}

async function syncInvoiceStatuses(referenceDate = new Date()) {
  const today = startOfDay(referenceDate);

  await prisma.invoice.updateMany({
    where: {
      dueDate: { lt: today },
      balanceDue: { gt: 0 },
      status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIAL] }
    },
    data: {
      status: InvoiceStatus.OVERDUE
    }
  });
}

async function createRecurringInvoice(subscription: {
  id: string;
  companyId: string;
  contactId: string | null;
  serviceName: string;
  description: string | null;
  amount: unknown;
  taxRate: unknown;
  currency?: string | null;
}, issueDate: Date, paymentTermsDays: number) {
  const subtotalAmount = Number(subscription.amount);
  const taxAmount = subtotalAmount * (Number(subscription.taxRate) / 100);
  const totalAmount = subtotalAmount + taxAmount;
  const number = await generateInvoiceNumber();

  return prisma.invoice.create({
    data: {
      companyId: subscription.companyId,
      contactId: subscription.contactId,
      subscriptionId: subscription.id,
      number,
      status: InvoiceStatus.DRAFT,
      currency: subscription.currency ?? "GBP",
      issueDate,
      dueDate: addDays(issueDate, paymentTermsDays),
      subtotalAmount,
      taxAmount,
      discountAmount: 0,
      totalAmount,
      balanceDue: totalAmount,
      paymentReference: number,
      notes: subscription.description ?? `Recurring service renewal for ${subscription.serviceName}.`,
      terms: `Payment due within ${paymentTermsDays} days.`,
      items: {
        create: [
          {
            description: subscription.serviceName,
            quantity: 1,
            unitPrice: subtotalAmount,
            taxRate: Number(subscription.taxRate),
            discountAmount: 0,
            lineTotal: subtotalAmount,
            sortOrder: 1
          }
        ]
      }
    }
  });
}

async function generateSubscriptionInvoices(referenceDate = new Date()) {
  const today = startOfDay(referenceDate);
  const billingDefaults = await prisma.setting.findUnique({
    where: {
      category_key: {
        category: "billing",
        key: "defaults"
      }
    }
  });
  const paymentTermsDays = Number((billingDefaults?.value as { paymentTermsDays?: number } | null)?.paymentTermsDays ?? 14);

  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: SubscriptionStatus.ACTIVE,
      autoGenerateInvoice: true,
      nextBillingDate: { lte: today }
    },
    include: {
      company: true,
      contact: true
    },
    orderBy: { nextBillingDate: "asc" }
  });

  let generatedCount = 0;

  for (const subscription of subscriptions) {
    if (subscription.cancelledAt && startOfDay(subscription.cancelledAt) <= today) {
      continue;
    }

    let cycleDate = startOfDay(subscription.nextBillingDate);
    let lastProcessedDate: Date | null = null;
    let safetyCounter = 0;

    while (cycleDate <= today && safetyCounter < 24) {
      const nextCycleDate = startOfDay(advanceBillingDate(cycleDate, subscription.frequency, subscription.intervalCount));
      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          subscriptionId: subscription.id,
          issueDate: {
            gte: cycleDate,
            lt: addDays(cycleDate, 1)
          },
          status: {
            not: InvoiceStatus.CANCELLED
          }
        },
        select: { id: true, number: true }
      });

      let invoiceId = existingInvoice?.id;
      let invoiceNumber = existingInvoice?.number;

      if (!existingInvoice) {
        const createdInvoice = await createRecurringInvoice(
          {
            id: subscription.id,
            companyId: subscription.companyId,
            contactId: subscription.contactId,
            serviceName: subscription.serviceName,
            description: subscription.description,
            amount: subscription.amount,
            taxRate: subscription.taxRate,
            currency: subscription.company.currency
          },
          cycleDate,
          paymentTermsDays
        );

        invoiceId = createdInvoice.id;
        invoiceNumber = createdInvoice.number;
        generatedCount += 1;

        await prisma.subscriptionEvent.create({
          data: {
            subscriptionId: subscription.id,
            type: SubscriptionEventType.INVOICE_GENERATED,
            summary: `Generated recurring invoice ${createdInvoice.number} for ${formatDate(cycleDate)}.`
          }
        });

        await prisma.communicationLog.create({
          data: {
            companyId: subscription.companyId,
            contactId: subscription.contactId,
            subscriptionId: subscription.id,
            invoiceId: createdInvoice.id,
            type: "SYSTEM",
            title: `Recurring invoice ${createdInvoice.number} generated`,
            body: `Generated invoice for the ${subscription.serviceName} billing cycle starting ${formatDate(cycleDate)}.`
          }
        });

        if (subscription.autoSendReminders) {
          try {
            await sendInvoiceDelivery(createdInvoice.id);
          } catch (error) {
            await prisma.communicationLog.create({
              data: {
                companyId: subscription.companyId,
                contactId: subscription.contactId,
                subscriptionId: subscription.id,
                invoiceId: createdInvoice.id,
                type: "SYSTEM",
                title: `Auto-send failed for ${createdInvoice.number}`,
                body: error instanceof Error ? error.message : "Unknown invoice delivery error."
              }
            });
          }
        }
      }

      if (invoiceId && invoiceNumber) {
        await logAudit(
          "subscription.invoice_generated",
          "subscription",
          subscription.id,
          `Processed recurring invoice ${invoiceNumber} for ${subscription.serviceName}`,
          null,
          { invoiceId, billingDate: cycleDate.toISOString() }
        );
      }

      lastProcessedDate = cycleDate;
      cycleDate = nextCycleDate;
      safetyCounter += 1;
    }

    if (lastProcessedDate) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          lastInvoicedAt: lastProcessedDate,
          nextBillingDate: cycleDate
        }
      });
    }
  }

  return generatedCount;
}

export async function enqueueReminderJobs(referenceDate = new Date()) {
  const today = startOfDay(referenceDate);
  const rules = await prisma.reminderRule.findMany({
    where: { isActive: true }
  });

  if (!rules.length) {
    return;
  }

  const templates = await prisma.emailTemplate.findMany({
    where: {
      key: { in: rules.map((rule) => rule.templateKey) }
    }
  });
  const templateByKey = new Map(templates.map((template) => [template.key, template]));

  const [unpaidInvoices, activeSubscriptions, failedPayments] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE] }
      }
    }),
    prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        autoSendReminders: true
      }
    }),
    prisma.payment.findMany({
      where: {
        status: PaymentStatus.FAILED
      },
      include: {
        invoice: {
          include: {
            subscription: true
          }
        }
      }
    })
  ]);

  const invoiceRules = rules.filter(
    (rule) =>
      rule.kind === ReminderKind.INVOICE_PRE_DUE ||
      rule.kind === ReminderKind.INVOICE_DUE_TODAY ||
      rule.kind === ReminderKind.INVOICE_OVERDUE
  );
  const subscriptionRules = rules.filter((rule) => rule.kind === ReminderKind.SUBSCRIPTION_RENEWAL);
  const failedPaymentRules = rules.filter((rule) => rule.kind === ReminderKind.FAILED_PAYMENT);

  for (const invoice of unpaidInvoices) {
    for (const rule of invoiceRules) {
      const scheduledFor = getScheduledDateForRule(invoice.dueDate, rule.kind, rule.daysOffset);
      if (scheduledFor.getTime() !== today.getTime()) {
        continue;
      }

      const semanticOffset = getPositiveOffset(rule.daysOffset);
      const template = templateByKey.get(rule.templateKey);

      await prisma.reminderJob.upsert({
        where: {
          idempotencyKey: `${rule.kind}-${invoice.id}-${semanticOffset}`
        },
        update: {
          emailTemplateId: template?.id ?? null,
          payload: { daysOffset: semanticOffset, templateKey: rule.templateKey }
        },
        create: {
          idempotencyKey: `${rule.kind}-${invoice.id}-${semanticOffset}`,
          kind: rule.kind,
          scheduledFor,
          companyId: invoice.companyId,
          contactId: invoice.contactId,
          invoiceId: invoice.id,
          emailTemplateId: template?.id ?? null,
          payload: { daysOffset: semanticOffset, templateKey: rule.templateKey }
        }
      });
    }
  }

  for (const subscription of activeSubscriptions) {
    if (subscription.cancelledAt && startOfDay(subscription.cancelledAt) <= today) {
      continue;
    }

    for (const rule of subscriptionRules) {
      const scheduledFor = getScheduledDateForRule(subscription.nextBillingDate, rule.kind, rule.daysOffset);
      if (scheduledFor.getTime() !== today.getTime()) {
        continue;
      }

      const semanticOffset = getPositiveOffset(rule.daysOffset);
      const template = templateByKey.get(rule.templateKey);

      await prisma.reminderJob.upsert({
        where: {
          idempotencyKey: `subscription-${subscription.id}-${semanticOffset}`
        },
        update: {
          emailTemplateId: template?.id ?? null,
          payload: { daysOffset: semanticOffset, templateKey: rule.templateKey }
        },
        create: {
          idempotencyKey: `subscription-${subscription.id}-${semanticOffset}`,
          kind: ReminderKind.SUBSCRIPTION_RENEWAL,
          scheduledFor,
          companyId: subscription.companyId,
          contactId: subscription.contactId,
          subscriptionId: subscription.id,
          emailTemplateId: template?.id ?? null,
          payload: { daysOffset: semanticOffset, templateKey: rule.templateKey }
        }
      });
    }
  }

  for (const payment of failedPayments) {
    if (
      (payment.invoice.status === InvoiceStatus.PAID || payment.invoice.status === InvoiceStatus.CANCELLED) &&
      Number(payment.invoice.balanceDue) <= 0
    ) {
      continue;
    }

    if (payment.invoice.status === InvoiceStatus.PAID || payment.invoice.status === InvoiceStatus.CANCELLED) {
      continue;
    }

    for (const rule of failedPaymentRules) {
      const scheduledFor = getScheduledDateForRule(payment.paidAt, rule.kind, rule.daysOffset);
      if (scheduledFor.getTime() !== today.getTime()) {
        continue;
      }

      const semanticOffset = getPositiveOffset(rule.daysOffset);
      const template = templateByKey.get(rule.templateKey);

      await prisma.reminderJob.upsert({
        where: {
          idempotencyKey: `failed-payment-${payment.id}-${semanticOffset}`
        },
        update: {
          emailTemplateId: template?.id ?? null,
          payload: {
            daysOffset: semanticOffset,
            templateKey: rule.templateKey,
            paymentId: payment.id,
            failedPaymentAt: payment.paidAt.toISOString()
          }
        },
        create: {
          idempotencyKey: `failed-payment-${payment.id}-${semanticOffset}`,
          kind: ReminderKind.FAILED_PAYMENT,
          scheduledFor,
          companyId: payment.invoice.companyId,
          contactId: payment.invoice.contactId,
          invoiceId: payment.invoiceId,
          subscriptionId: payment.invoice.subscriptionId,
          emailTemplateId: template?.id ?? null,
          payload: {
            daysOffset: semanticOffset,
            templateKey: rule.templateKey,
            paymentId: payment.id,
            failedPaymentAt: payment.paidAt.toISOString()
          }
        }
      });
    }
  }
}

function getDefaultTemplateKey(kind: ReminderKind) {
  if (kind === ReminderKind.SUBSCRIPTION_RENEWAL) {
    return "renewal_reminder";
  }

  if (kind === ReminderKind.INVOICE_OVERDUE || kind === ReminderKind.FAILED_PAYMENT) {
    return "overdue_invoice";
  }

  return "invoice_reminder";
}

async function getJobSkipReason(job: {
  kind: ReminderKind;
  invoice: { id: string; status: InvoiceStatus; balanceDue: unknown } | null;
  subscription: { status: SubscriptionStatus; cancelledAt: Date | null } | null;
  payload: unknown;
}) {
  if (job.kind === ReminderKind.SUBSCRIPTION_RENEWAL) {
    if (!job.subscription || job.subscription.status !== SubscriptionStatus.ACTIVE) {
      return "Subscription is no longer active.";
    }

    if (job.subscription.cancelledAt) {
      return "Subscription has been cancelled.";
    }

    return null;
  }

  if (!job.invoice) {
    return "Invoice not found.";
  }

  if ((job.invoice.status === InvoiceStatus.PAID || job.invoice.status === InvoiceStatus.CANCELLED) || Number(job.invoice.balanceDue) <= 0) {
    return "Invoice no longer requires billing follow-up.";
  }

  if (job.kind === ReminderKind.FAILED_PAYMENT) {
    const payload = (job.payload ?? {}) as { failedPaymentAt?: string };
    if (payload.failedPaymentAt) {
      const recoveredPayment = await prisma.payment.findFirst({
        where: {
          invoiceId: job.invoice.id,
          status: PaymentStatus.COMPLETED,
          paidAt: {
            gte: new Date(payload.failedPaymentAt)
          }
        },
        select: { id: true }
      });

      if (recoveredPayment) {
        return "A successful payment was recorded after the failed attempt.";
      }
    }
  }

  return null;
}

async function syncBusinessSubscriptionNotifications(referenceDate = new Date()) {
  const today = startOfDay(referenceDate);
  const inThirtyDays = addDays(today, 30);

  const [subscriptions, recipients] = await Promise.all([
    prisma.businessSubscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        autoNotify: true,
        nextPaymentDate: { lte: inThirtyDays }
      },
      include: {
        renewalOwner: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { nextPaymentDate: "asc" }
    }),
    prisma.user.findMany({
      where: {
        status: "ACTIVE",
        userRoles: {
          some: {
            role: {
              permissions: {
                some: {
                  permission: {
                    key: "subscriptions.view"
                  }
                }
              }
            }
          }
        }
      },
      select: { id: true }
    })
  ]);

  if (!subscriptions.length || !recipients.length) {
    return 0;
  }

  const existingNotifications = await prisma.notification.findMany({
    where: {
      userId: { in: recipients.map((recipient) => recipient.id) },
      actionUrl: "/outgoings",
      createdAt: { gte: today }
    },
    select: {
      userId: true,
      title: true
    }
  });
  const existingKeys = new Set(existingNotifications.map((notification) => `${notification.userId}:${notification.title}`));
  const notificationsToCreate: Array<{ userId: string; title: string; body: string; actionUrl: string }> = [];

  for (const subscription of subscriptions) {
    const dueDate = startOfDay(subscription.nextPaymentDate);
    const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const reminderOffsets = subscription.reminderDaysBefore.length ? subscription.reminderDaysBefore : [14, 7, 3];

    if (daysUntilDue > 0 && !reminderOffsets.includes(daysUntilDue)) {
      continue;
    }

    let title = "";
    if (daysUntilDue < 0) {
      title = `${subscription.vendorName} payment overdue`;
    } else if (daysUntilDue === 0) {
      title = `Payment due today: ${subscription.vendorName}`;
    } else {
      title = `Payment due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}: ${subscription.vendorName}`;
    }

    const ownerSummary = subscription.renewalOwner
      ? ` Renewal owner: ${subscription.renewalOwner.firstName} ${subscription.renewalOwner.lastName}.`
      : "";
    const body = `${subscription.serviceName} costs ${formatCurrency(Number(subscription.amount), subscription.currency)} and is due ${formatDate(
      subscription.nextPaymentDate
    )}.${ownerSummary}`;

    for (const recipient of recipients) {
      const key = `${recipient.id}:${title}`;
      if (existingKeys.has(key)) {
        continue;
      }

      existingKeys.add(key);
      notificationsToCreate.push({
        userId: recipient.id,
        title,
        body,
        actionUrl: "/outgoings"
      });
    }
  }

  if (!notificationsToCreate.length) {
    return 0;
  }

  await prisma.notification.createMany({
    data: notificationsToCreate
  });

  return notificationsToCreate.length;
}

export async function runReminderSweep(referenceDate = new Date()) {
  await syncInvoiceStatuses(referenceDate);
  await generateSubscriptionInvoices(referenceDate);
  await enqueueReminderJobs(referenceDate);
  await syncBusinessSubscriptionNotifications(referenceDate);

  const jobs = await prisma.reminderJob.findMany({
    where: {
      status: ReminderJobStatus.PENDING,
      scheduledFor: { lte: referenceDate }
    },
    include: {
      company: true,
      contact: true,
      invoice: true,
      subscription: true,
      emailTemplate: true
    },
    orderBy: { scheduledFor: "asc" }
  });

  for (const job of jobs) {
    try {
      const skipReason = await getJobSkipReason(job);
      if (skipReason) {
        await prisma.reminderJob.update({
          where: { id: job.id },
          data: {
            status: ReminderJobStatus.SKIPPED,
            processedAt: new Date(),
            errorMessage: skipReason
          }
        });
        continue;
      }

      const payload = (job.payload ?? {}) as { templateKey?: string };
      const template =
        job.emailTemplate ??
        (await prisma.emailTemplate.findUnique({
          where: { key: payload.templateKey ?? getDefaultTemplateKey(job.kind) }
        }));
      const toAddress = job.contact?.email ?? job.company?.billingEmail ?? null;

      if (!template || !template.isActive || !toAddress) {
        await prisma.reminderJob.update({
          where: { id: job.id },
          data: {
            status: ReminderJobStatus.SKIPPED,
            processedAt: new Date(),
            errorMessage: "Missing active email template or recipient email."
          }
        });
        continue;
      }

      const context = {
        business: {
          name: process.env.BUSINESS_NAME ?? "Appathy CRM"
        },
        contact: {
          firstName: job.contact?.firstName ?? "there",
          lastName: job.contact?.lastName ?? ""
        },
        company: {
          name: job.company?.name ?? ""
        },
        invoice: job.invoice
          ? {
              number: job.invoice.number,
              dueDate: formatDate(job.invoice.dueDate),
              balanceDue: formatCurrency(Number(job.invoice.balanceDue), job.invoice.currency),
              totalAmount: formatCurrency(Number(job.invoice.totalAmount), job.invoice.currency)
            }
          : {},
        subscription: job.subscription
          ? {
              serviceName: job.subscription.serviceName,
              nextBillingDate: formatDate(job.subscription.nextBillingDate)
            }
          : {}
      };

      const subject = renderTemplate(template.subject, context);
      const html = renderTemplate(template.bodyHtml, context);
      const text = renderTemplate(template.bodyText, context);

      await sendEmail({
        to: toAddress,
        subject,
        html,
        text,
        templateKey: template.key,
        companyId: job.companyId,
        contactId: job.contactId,
        invoiceId: job.invoiceId,
        subscriptionId: job.subscriptionId,
        reminderJobId: job.id
      });

      await prisma.reminderJob.update({
        where: { id: job.id },
        data: {
          status: ReminderJobStatus.SENT,
          processedAt: new Date()
        }
      });

      await prisma.communicationLog.create({
        data: {
          companyId: job.companyId,
          contactId: job.contactId,
          invoiceId: job.invoiceId,
          subscriptionId: job.subscriptionId,
          type: "EMAIL",
          title: `${template.name} sent`,
          body: `Sent ${template.key} to ${toAddress}.`
        }
      });

      await logAudit(
        "reminder.sent",
        "reminder_job",
        job.id,
        `Sent ${job.kind.toLowerCase()} reminder to ${toAddress}`
      );
    } catch (error) {
      await prisma.reminderJob.update({
        where: { id: job.id },
        data: {
          status: ReminderJobStatus.FAILED,
          processedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : "Unknown reminder error"
        }
      });
    }
  }

  return jobs.length;
}
