import { InvoiceStatus, NotificationStatus, PaymentStatus, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { addDays, serialize, startOfDay } from "@/lib/utils";
import { getMonthlyRecurringValue } from "@/server/services/subscription-billing";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export async function getDashboardData() {
  const now = new Date();
  const today = startOfDay(now);
  const monthStart = startOfMonth(today);
  const nextMonthStart = addMonths(monthStart, 1);
  const yearStart = new Date(today.getFullYear(), 0, 1);
  const seriesStart = addMonths(monthStart, -5);

  const [
    companies,
    activeCustomerSubscriptions,
    unpaidInvoices,
    overdueInvoices,
    collectedPayments,
    recentActivity,
    upcomingRenewals,
    notifications,
    reminderQueue,
    tasks,
    activeBusinessSubscriptions,
    completedOutgoingPayments,
    upcomingOutgoingPayments
  ] =
    await Promise.all([
      prisma.company.count(),
      prisma.subscription.findMany({
        where: { status: "ACTIVE" },
        select: {
          amount: true,
          frequency: true,
          intervalCount: true
        }
      }),
      prisma.invoice.count({
        where: {
          status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE] }
        }
      }),
      prisma.invoice.count({
        where: {
          dueDate: { lt: today },
          status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE] }
        }
      }),
      prisma.payment.findMany({
        where: {
          status: PaymentStatus.COMPLETED,
          paidAt: {
            gte: seriesStart,
            lt: nextMonthStart
          }
        },
        select: {
          amount: true,
          paidAt: true
        },
        orderBy: { paidAt: "asc" }
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8
      }),
      prisma.subscription.findMany({
        where: {
          status: "ACTIVE",
          nextBillingDate: {
            gte: today,
            lte: addDays(today, 30)
          }
        },
        include: { company: true },
        orderBy: { nextBillingDate: "asc" },
        take: 8
      }),
      prisma.notification.findMany({
        where: { status: NotificationStatus.UNREAD },
        orderBy: { createdAt: "desc" },
        take: 6
      }),
      prisma.reminderJob.groupBy({
        by: ["status"],
        _count: true
      }),
      prisma.task.findMany({
        where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
        take: 6,
        include: { company: true, assignedTo: true }
      }),
      prisma.businessSubscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE
        },
        include: {
          renewalOwner: {
            select: { firstName: true, lastName: true }
          }
        }
      }),
      prisma.businessSubscriptionPayment.findMany({
        where: {
          status: PaymentStatus.COMPLETED,
          paidAt: {
            gte: monthStart,
            lt: nextMonthStart
          }
        },
        select: {
          amount: true
        }
      }),
      prisma.businessSubscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          nextPaymentDate: {
            gte: today,
            lte: addDays(today, 30)
          }
        },
        include: {
          renewalOwner: {
            select: { firstName: true, lastName: true }
          }
        },
        orderBy: { nextPaymentDate: "asc" },
        take: 6
      })
    ]);

  let revenueThisMonth = 0;
  let revenueThisYear = 0;
  const recurringMonthlyOutgoing = activeBusinessSubscriptions.reduce(
    (sum, subscription) => sum + getMonthlyRecurringValue(subscription),
    0
  );
  const outgoingThisMonth = completedOutgoingPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  const monthBuckets = new Map<string, { label: string; value: number }>();
  for (let index = 0; index < 6; index += 1) {
    const bucketDate = addMonths(seriesStart, index);
    monthBuckets.set(`${bucketDate.getFullYear()}-${bucketDate.getMonth()}`, {
      label: bucketDate.toLocaleString("en-GB", { month: "short" }),
      value: 0
    });
  }

  for (const payment of collectedPayments) {
    const paidAt = new Date(payment.paidAt);
    const amount = Number(payment.amount);
    const bucket = monthBuckets.get(`${paidAt.getFullYear()}-${paidAt.getMonth()}`);

    if (bucket) {
      bucket.value += amount;
    }

    if (paidAt >= yearStart && paidAt < nextMonthStart) {
      revenueThisYear += amount;
      if (paidAt >= monthStart && paidAt < nextMonthStart) {
        revenueThisMonth += amount;
      }
    }
  }

  return serialize({
    metrics: {
      totalCustomers: companies,
      activeSubscriptions: activeCustomerSubscriptions.length,
      activeOutgoingSubscriptions: activeBusinessSubscriptions.length,
      unpaidInvoices,
      overdueInvoices,
      revenueThisMonth,
      revenueThisYear,
      outgoingsThisMonth: outgoingThisMonth,
      netThisMonth: revenueThisMonth - outgoingThisMonth,
      recurringMonthlyOutgoing,
      recurringMargin:
        activeCustomerSubscriptions.reduce((sum, subscription) => sum + getMonthlyRecurringValue(subscription), 0) - recurringMonthlyOutgoing
    },
    revenueSeries: Array.from(monthBuckets.values()),
    recentActivity,
    upcomingRenewals,
    upcomingOutgoings: upcomingOutgoingPayments,
    notifications,
    tasks,
    reminderQueue
  });
}
