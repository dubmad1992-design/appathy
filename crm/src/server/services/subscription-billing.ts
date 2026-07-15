import { BillingFrequency, type BusinessSubscription, type Subscription } from "@prisma/client";

function getIntervalMonths(frequency: BillingFrequency, intervalCount: number) {
  switch (frequency) {
    case BillingFrequency.MONTHLY:
      return intervalCount;
    case BillingFrequency.QUARTERLY:
      return intervalCount * 3;
    case BillingFrequency.ANNUALLY:
      return intervalCount * 12;
    case BillingFrequency.CUSTOM:
      return intervalCount;
    default:
      return intervalCount;
  }
}

export function advanceBillingDate(currentDate: Date, frequency: BillingFrequency, intervalCount: number) {
  const next = new Date(currentDate);
  next.setMonth(next.getMonth() + getIntervalMonths(frequency, intervalCount));
  return next;
}

export function getMonthlyRecurringValue(
  subscription: Pick<Subscription, "amount" | "frequency" | "intervalCount"> | Pick<BusinessSubscription, "amount" | "frequency" | "intervalCount">
) {
  const amount = Number(subscription.amount);
  const intervalMonths = Math.max(getIntervalMonths(subscription.frequency, subscription.intervalCount), 1);
  return amount / intervalMonths;
}
