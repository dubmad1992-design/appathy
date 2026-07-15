import { InvoiceStatus, PaymentStatus, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { addDays, serialize, startOfDay } from "@/lib/utils";
import { getMonthlyRecurringValue } from "@/server/services/subscription-billing";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function getMonthLabel(date: Date) {
  return date.toLocaleString("en-GB", { month: "short" });
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function getReportingData(referenceDate = new Date()) {
  const today = startOfDay(referenceDate);
  const monthStart = startOfMonth(today);
  const nextMonthStart = addMonths(monthStart, 1);
  const yearStart = new Date(today.getFullYear(), 0, 1);
  const seriesStart = addMonths(monthStart, -11);

  const [
    completedPayments,
    openInvoices,
    activeSubscriptions,
    renewalsDueThisMonth,
    invoiceBreakdown,
    completedOutgoingPayments,
    activeBusinessSubscriptions,
    dueThisMonthOutgoings,
    dueNext30DaysOutgoings
  ] = await Promise.all([
    prisma.payment.findMany({
      where: {
        status: PaymentStatus.COMPLETED,
        paidAt: {
          gte: seriesStart,
          lt: nextMonthStart
        }
      },
      include: {
        invoice: {
          include: {
            company: true
          }
        }
      },
      orderBy: { paidAt: "asc" }
    }),
    prisma.invoice.findMany({
      where: {
        status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE] }
      },
      include: {
        company: true
      }
    }),
    prisma.subscription.findMany({
      where: { status: SubscriptionStatus.ACTIVE },
      include: { company: true }
    }),
    prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        nextBillingDate: {
          gte: monthStart,
          lt: nextMonthStart
        }
      },
      include: { company: true },
      orderBy: { nextBillingDate: "asc" }
    }),
    prisma.invoice.groupBy({
      by: ["status"],
      _count: true
    }),
    prisma.businessSubscriptionPayment.findMany({
      where: {
        status: PaymentStatus.COMPLETED,
        paidAt: {
          gte: seriesStart,
          lt: nextMonthStart
        }
      },
      include: {
        businessSubscription: true
      },
      orderBy: { paidAt: "asc" }
    }),
    prisma.businessSubscription.findMany({
      where: { status: SubscriptionStatus.ACTIVE },
      include: {
        renewalOwner: {
          select: { firstName: true, lastName: true }
        }
      }
    }),
    prisma.businessSubscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        nextPaymentDate: {
          gte: monthStart,
          lt: nextMonthStart
        }
      },
      include: {
        renewalOwner: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { nextPaymentDate: "asc" }
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
      orderBy: { nextPaymentDate: "asc" }
    })
  ]);

  const monthBuckets = new Map<string, { label: string; value: number }>();
  const outgoingBuckets = new Map<string, { label: string; value: number }>();
  for (let index = 0; index < 12; index += 1) {
    const bucketDate = addMonths(seriesStart, index);
    const bucketValue = {
      label: getMonthLabel(bucketDate),
      value: 0
    };
    monthBuckets.set(getMonthKey(bucketDate), bucketValue);
    outgoingBuckets.set(getMonthKey(bucketDate), { ...bucketValue });
  }

  let lifetimeCollections = 0;
  let collectionsThisMonth = 0;
  let collectionsThisYear = 0;
  let lifetimeOutgoingPayments = 0;
  let outgoingPaymentsThisMonth = 0;
  let outgoingPaymentsThisYear = 0;
  const customerLifetimeValue = new Map<string, { name: string; value: number }>();

  for (const payment of completedPayments) {
    const amount = Number(payment.amount);
    const paidAt = new Date(payment.paidAt);
    const bucket = monthBuckets.get(getMonthKey(paidAt));

    if (bucket) {
      bucket.value += amount;
    }

    lifetimeCollections += amount;

    if (paidAt >= monthStart && paidAt < nextMonthStart) {
      collectionsThisMonth += amount;
    }

    if (paidAt >= yearStart && paidAt < nextMonthStart) {
      collectionsThisYear += amount;
    }

    const companyId = payment.invoice.companyId;
    const existing = customerLifetimeValue.get(companyId);
    if (existing) {
      existing.value += amount;
    } else {
      customerLifetimeValue.set(companyId, {
        name: payment.invoice.company.name,
        value: amount
      });
    }
  }

  for (const payment of completedOutgoingPayments) {
    const amount = Number(payment.amount);
    const paidAt = new Date(payment.paidAt);
    const bucket = outgoingBuckets.get(getMonthKey(paidAt));

    if (bucket) {
      bucket.value += amount;
    }

    lifetimeOutgoingPayments += amount;

    if (paidAt >= monthStart && paidAt < nextMonthStart) {
      outgoingPaymentsThisMonth += amount;
    }

    if (paidAt >= yearStart && paidAt < nextMonthStart) {
      outgoingPaymentsThisYear += amount;
    }
  }

  const recurringMonthlyRevenue = activeSubscriptions.reduce((sum, subscription) => sum + getMonthlyRecurringValue(subscription), 0);
  const recurringMonthlyOutgoing = activeBusinessSubscriptions.reduce((sum, subscription) => sum + getMonthlyRecurringValue(subscription), 0);
  const overdueInvoices = openInvoices.filter((invoice) => new Date(invoice.dueDate) < today);
  const overdueBalance = overdueInvoices.reduce((sum, invoice) => sum + Number(invoice.balanceDue), 0);
  const openBalance = openInvoices.reduce((sum, invoice) => sum + Number(invoice.balanceDue), 0);
  const projectedRenewalValue = renewalsDueThisMonth.reduce((sum, subscription) => sum + Number(subscription.amount), 0);
  const projectedOutgoingThisMonth = dueThisMonthOutgoings.reduce((sum, subscription) => sum + Number(subscription.amount), 0);
  const projectedOutgoingNext30Days = dueNext30DaysOutgoings.reduce((sum, subscription) => sum + Number(subscription.amount), 0);

  const overdueByCustomer = overdueInvoices
    .reduce<Array<{ companyId: string; companyName: string; balance: number; invoiceCount: number }>>((acc, invoice) => {
      const existing = acc.find((item) => item.companyId === invoice.companyId);
      if (existing) {
        existing.balance += Number(invoice.balanceDue);
        existing.invoiceCount += 1;
        return acc;
      }

      acc.push({
        companyId: invoice.companyId,
        companyName: invoice.company.name,
        balance: Number(invoice.balanceDue),
        invoiceCount: 1
      });
      return acc;
    }, [])
    .sort((left, right) => right.balance - left.balance)
    .slice(0, 5);

  const customerValueSummary = Array.from(customerLifetimeValue.values()).sort((left, right) => right.value - left.value);
  const averageLifetimeValue =
    customerValueSummary.length > 0
      ? customerValueSummary.reduce((sum, entry) => sum + entry.value, 0) / customerValueSummary.length
      : 0;
  const outgoingCategoryBreakdown = Array.from(
    activeBusinessSubscriptions.reduce((acc, subscription) => {
      const key = subscription.category || "Uncategorised";
      acc.set(key, (acc.get(key) ?? 0) + getMonthlyRecurringValue(subscription));
      return acc;
    }, new Map<string, number>())
  )
    .map(([category, value]) => ({ category, value }))
    .sort((left, right) => right.value - left.value);

  const collectionSeries = Array.from(monthBuckets.values());
  const outgoingSeries = Array.from(outgoingBuckets.values());
  const netCashSeries = collectionSeries.map((bucket, index) => ({
    label: bucket.label,
    value: bucket.value - (outgoingSeries[index]?.value ?? 0)
  }));

  return serialize({
    metrics: {
      lifetimeCollections,
      collectionsThisMonth,
      collectionsThisYear,
      lifetimeOutgoingPayments,
      outgoingPaymentsThisMonth,
      outgoingPaymentsThisYear,
      netCashThisMonth: collectionsThisMonth - outgoingPaymentsThisMonth,
      netCashThisYear: collectionsThisYear - outgoingPaymentsThisYear,
      recurringMonthlyRevenue,
      annualRecurringRevenue: recurringMonthlyRevenue * 12,
      recurringMonthlyOutgoing,
      annualRecurringOutgoing: recurringMonthlyOutgoing * 12,
      recurringMargin: recurringMonthlyRevenue - recurringMonthlyOutgoing,
      overdueBalance,
      openBalance,
      unpaidInvoiceCount: openInvoices.length,
      overdueInvoiceCount: overdueInvoices.length,
      renewalsDueThisMonth: renewalsDueThisMonth.length,
      projectedRenewalValue,
      outgoingsDueThisMonth: dueThisMonthOutgoings.length,
      projectedOutgoingThisMonth,
      outgoingsDueNext30Days: dueNext30DaysOutgoings.length,
      projectedOutgoingNext30Days,
      averageLifetimeValue
    },
    collectionsSeries: collectionSeries,
    outgoingSeries,
    netCashSeries,
    overdueByCustomer,
    renewalsDueThisMonth,
    upcomingOutgoings: dueNext30DaysOutgoings,
    outgoingCategoryBreakdown,
    recentOutgoingPayments: completedOutgoingPayments.slice(-6).reverse(),
    topCustomers: customerValueSummary.slice(0, 5),
    invoiceBreakdown
  });
}
