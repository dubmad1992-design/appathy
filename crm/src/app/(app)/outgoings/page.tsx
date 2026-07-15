import { PaymentStatus, SubscriptionStatus, type BillingFrequency, type BusinessSubscription } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import {
  createBusinessSubscriptionAction,
  deleteBusinessSubscriptionAction,
  recordBusinessSubscriptionPaymentAction,
  updateBusinessSubscriptionAction
} from "@/server/actions/crm";

function normalizeMonthlyAmount(amount: number, frequency: BillingFrequency, intervalCount: number) {
  const safeInterval = Math.max(intervalCount, 1);

  switch (frequency) {
    case "MONTHLY":
      return amount / safeInterval;
    case "QUARTERLY":
      return amount / (safeInterval * 3);
    case "ANNUALLY":
      return amount / (safeInterval * 12);
    case "CUSTOM":
      return amount / safeInterval;
    default:
      return amount;
  }
}

function sumByCurrency(subscriptions: BusinessSubscription[], selector: (subscription: BusinessSubscription) => number) {
  const totals = new Map<string, number>();

  for (const subscription of subscriptions) {
    const current = totals.get(subscription.currency) ?? 0;
    totals.set(subscription.currency, current + selector(subscription));
  }

  return Array.from(totals.entries());
}

function CurrencySummary({ entries, emptyLabel }: { entries: Array<[string, number]>; emptyLabel: string }) {
  if (!entries.length) {
    return <p className="mt-4 text-2xl font-semibold">{emptyLabel}</p>;
  }

  return (
    <div className="mt-4 space-y-2">
      {entries.map(([currency, value]) => (
        <div className="flex items-center justify-between gap-4" key={currency}>
          <p className="text-3xl font-semibold">{formatCurrency(value, currency)}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{currency}</p>
        </div>
      ))}
    </div>
  );
}

export default async function OutgoingsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser(PERMISSIONS.SUBSCRIPTIONS_VIEW);
  const canManage = user.permissions.includes(PERMISSIONS.SUBSCRIPTIONS_MANAGE);
  const params = await searchParams;
  const categoryFilter = typeof params.category === "string" ? params.category : "";
  const statusFilter = typeof params.status === "string" ? params.status : "";

  const [subscriptions, users, categories] = await Promise.all([
    prisma.businessSubscription.findMany({
      where: {
        category: categoryFilter || undefined,
        status: statusFilter ? (statusFilter as SubscriptionStatus) : undefined
      },
      include: {
        renewalOwner: {
          select: { id: true, firstName: true, lastName: true }
        },
        payments: {
          include: {
            recordedBy: {
              select: { firstName: true, lastName: true }
            }
          },
          orderBy: { paidAt: "desc" },
          take: 5
        }
      },
      orderBy: [{ nextPaymentDate: "asc" }, { vendorName: "asc" }, { serviceName: "asc" }]
    }),
    prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }]
    }),
    prisma.businessSubscription.findMany({
      where: {
        category: { not: null }
      },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" }
    })
  ]);

  const now = new Date();
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === SubscriptionStatus.ACTIVE);
  const dueThisMonth = activeSubscriptions.filter(
    (subscription) =>
      subscription.nextPaymentDate.getUTCFullYear() === now.getUTCFullYear() &&
      subscription.nextPaymentDate.getUTCMonth() === now.getUTCMonth()
  );
  const dueNext30Days = activeSubscriptions.filter(
    (subscription) => subscription.nextPaymentDate >= now && subscription.nextPaymentDate <= thirtyDaysFromNow
  );

  const monthlyTotals = sumByCurrency(activeSubscriptions, (subscription) =>
    normalizeMonthlyAmount(Number(subscription.amount), subscription.frequency, subscription.intervalCount)
  );
  const annualTotals = sumByCurrency(activeSubscriptions, (subscription) =>
    normalizeMonthlyAmount(Number(subscription.amount), subscription.frequency, subscription.intervalCount) * 12
  );
  const dueThisMonthTotals = sumByCurrency(dueThisMonth, (subscription) => Number(subscription.amount));
  const dueNext30DaysTotals = sumByCurrency(dueNext30Days, (subscription) => Number(subscription.amount));

  return (
    <div className="space-y-4">
      {(params.saved || params.deleted || params.paymentSaved) && (
        <p className="rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">
          {params.deleted ? "Outgoing subscription removed." : params.paymentSaved ? "Outgoing payment recorded." : "Outgoing subscription saved."}
        </p>
      )}
      {params.error ? (
        <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {params.error === "payment_validation"
            ? "We couldn&apos;t record that outgoing payment. Check the amount, date, and status."
            : "We couldn&apos;t save that outgoing subscription. Check the required fields, amount, and dates."}
        </p>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-4">
        <Card className="p-6">
          <div className="eyebrow">Active outgoings</div>
          <p className="mt-4 text-4xl font-semibold">{activeSubscriptions.length}</p>
          <p className="mt-2 text-sm text-muted-foreground">Recurring subscriptions your business is actively paying for.</p>
        </Card>
        <Card className="p-6">
          <div className="eyebrow">Monthly outgoing</div>
          <CurrencySummary emptyLabel="No active costs" entries={monthlyTotals} />
          <p className="mt-2 text-sm text-muted-foreground">Normalized monthly cost across the visible subscriptions.</p>
        </Card>
        <Card className="p-6">
          <div className="eyebrow">Annual outgoing</div>
          <CurrencySummary emptyLabel="No annualized cost" entries={annualTotals} />
          <p className="mt-2 text-sm text-muted-foreground">Projected yearly cost based on the current recurring stack.</p>
        </Card>
        <Card className="p-6">
          <div className="eyebrow">Due in 30 days</div>
          <CurrencySummary emptyLabel="Nothing due soon" entries={dueNext30DaysTotals} />
          <p className="mt-2 text-sm text-muted-foreground">{dueNext30Days.length} active payment(s) scheduled in the next 30 days.</p>
        </Card>
      </section>

      <Card className="p-6">
        <div className="eyebrow">Filters</div>
        <form className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_auto]" method="get">
          <select className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={categoryFilter} name="category">
            <option value="">All categories</option>
            {categories
              .map((entry) => entry.category)
              .filter((value): value is string => Boolean(value))
              .map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
          </select>
          <select className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={statusFilter} name="status">
            <option value="">All statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PAUSED">PAUSED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>
          <button className="inline-flex h-11 items-center justify-center rounded-2xl border border-border/70 px-4 text-sm font-semibold" type="submit">
            Apply
          </button>
        </form>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="eyebrow">Business subscriptions</div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight">Outgoings, renewal dates, payments, and what needs paying next</h1>
            </div>
            <div className="rounded-2xl border border-border/70 px-4 py-3 text-sm">
              <p className="text-muted-foreground">Due this month</p>
              <div className="mt-2 space-y-1">
                {dueThisMonthTotals.length ? (
                  dueThisMonthTotals.map(([currency, value]) => (
                    <p className="font-semibold" key={currency}>
                      {formatCurrency(value, currency)}
                    </p>
                  ))
                ) : (
                  <p className="font-semibold">Nothing scheduled</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {subscriptions.length ? (
              subscriptions.map((subscription) => (
                <div
                  className="rounded-3xl border border-border/70 p-5"
                  data-outgoing-service={subscription.serviceName}
                  data-outgoing-vendor={subscription.vendorName}
                  data-testid="outgoing-card"
                  key={subscription.id}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-semibold">{subscription.vendorName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{subscription.serviceName}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {subscription.frequency} every {subscription.intervalCount} cycle(s) • {subscription.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{formatCurrency(Number(subscription.amount), subscription.currency)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Next payment {formatDate(subscription.nextPaymentDate)}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
                    <div>
                      <p className="font-medium text-foreground">Category</p>
                      <p className="mt-1">{subscription.category || "Uncategorised"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Supplier support</p>
                      <p className="mt-1">{subscription.supportEmail || "Not set"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Renewal owner</p>
                      <p className="mt-1">
                        {subscription.renewalOwner ? `${subscription.renewalOwner.firstName} ${subscription.renewalOwner.lastName}` : "Not assigned"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Account number</p>
                      <p className="mt-1">{subscription.accountNumber || "Not set"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Payment method</p>
                      <p className="mt-1">{subscription.paymentMethod || "Not set"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Renewal</p>
                      <p className="mt-1">{subscription.renewalDate ? formatDate(subscription.renewalDate) : "Not set"}</p>
                    </div>
                  </div>

                  {canManage ? (
                    <form action={updateBusinessSubscriptionAction} className="mt-5 space-y-4">
                      <input name="subscriptionId" type="hidden" value={subscription.id} />
                      <div className="grid gap-4 lg:grid-cols-2">
                        <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={subscription.vendorName} name="vendorName" placeholder="Vendor" required />
                        <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={subscription.serviceName} name="serviceName" placeholder="Service" required />
                        <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={subscription.category ?? ""} name="category" placeholder="Category" />
                        <select className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={subscription.status} name="status">
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="PAUSED">PAUSED</option>
                          <option value="CANCELLED">CANCELLED</option>
                          <option value="EXPIRED">EXPIRED</option>
                        </select>
                        <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={subscription.supportEmail ?? ""} name="supportEmail" placeholder="Support email" type="email" />
                        <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={subscription.accountNumber ?? ""} name="accountNumber" placeholder="Account number" />
                        <select className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={subscription.renewalOwnerUserId ?? ""} name="renewalOwnerUserId">
                          <option value="">Renewal owner</option>
                          {users.map((record) => (
                            <option key={record.id} value={record.id}>
                              {record.firstName} {record.lastName}
                            </option>
                          ))}
                        </select>
                        <select className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={subscription.frequency} name="frequency">
                          <option value="MONTHLY">MONTHLY</option>
                          <option value="QUARTERLY">QUARTERLY</option>
                          <option value="ANNUALLY">ANNUALLY</option>
                          <option value="CUSTOM">CUSTOM</option>
                        </select>
                        <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={subscription.intervalCount} min="1" name="intervalCount" placeholder="Interval count" type="number" />
                        <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={Number(subscription.amount)} min="0.01" name="amount" placeholder="Amount" step="0.01" type="number" />
                        <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={subscription.currency} maxLength={3} name="currency" placeholder="Currency" />
                        <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={subscription.nextPaymentDate.toISOString().slice(0, 10)} name="nextPaymentDate" type="date" />
                        <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={subscription.renewalDate?.toISOString().slice(0, 10) ?? ""} name="renewalDate" type="date" />
                        <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={subscription.paymentMethod ?? ""} name="paymentMethod" placeholder="Payment method" />
                        <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={subscription.reference ?? ""} name="reference" placeholder="Reference / account ID" />
                        <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm lg:col-span-2" defaultValue={subscription.website ?? ""} name="website" placeholder="Website or portal URL" />
                        <input
                          className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm lg:col-span-2"
                          defaultValue={subscription.reminderDaysBefore.join(", ")}
                          name="reminderDaysBefore"
                          placeholder="Reminder days before, comma separated"
                        />
                      </div>
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input defaultChecked={subscription.autoNotify} name="autoNotify" type="checkbox" />
                        Create internal reminders before this payment is due
                      </label>
                      <textarea className="min-h-24 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" defaultValue={subscription.notes ?? ""} name="notes" placeholder="Notes" />
                      <div className="flex flex-wrap gap-2">
                        <button className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 px-4 text-sm font-semibold" type="submit">
                          Save changes
                        </button>
                        <button
                          className="inline-flex h-10 items-center justify-center rounded-2xl border border-danger/30 px-4 text-sm font-semibold text-danger"
                          formAction={deleteBusinessSubscriptionAction}
                          type="submit"
                        >
                          Delete
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">{subscription.notes || "No notes added."}</p>
                  )}

                  <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_0.85fr]">
                    <div>
                      <p className="text-sm font-semibold">Payment history</p>
                      <div className="mt-3 space-y-3">
                        {subscription.payments.length ? (
                          subscription.payments.map((payment) => (
                            <div className="rounded-2xl border border-border/70 p-4" key={payment.id}>
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium">{formatCurrency(Number(payment.amount), payment.currency)}</p>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {payment.status} on {formatDate(payment.paidAt)}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {payment.method || "No method"} • {payment.reference || "No reference"}
                                  </p>
                                </div>
                                <div className="text-right text-xs text-muted-foreground">
                                  <p>{payment.recordedBy ? `${payment.recordedBy.firstName} ${payment.recordedBy.lastName}` : "System"}</p>
                                  <p>{formatDateTime(payment.createdAt)}</p>
                                </div>
                              </div>
                              {payment.note ? <p className="mt-2 text-sm text-muted-foreground">{payment.note}</p> : null}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No outgoing payments recorded yet.</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold">Record payment</p>
                      {canManage ? (
                        <form action={recordBusinessSubscriptionPaymentAction} className="mt-3 space-y-4" data-testid="record-outgoing-payment-form">
                          <input name="businessSubscriptionId" type="hidden" value={subscription.id} />
                          <div className="grid gap-4 lg:grid-cols-2">
                            <select className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue="COMPLETED" name="status">
                              <option value="COMPLETED">COMPLETED</option>
                              <option value="PENDING">PENDING</option>
                              <option value="FAILED">FAILED</option>
                              <option value="REFUNDED">REFUNDED</option>
                            </select>
                            <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={Number(subscription.amount)} min="0.01" name="amount" step="0.01" type="number" />
                            <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={subscription.currency} maxLength={3} name="currency" />
                            <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={new Date().toISOString().slice(0, 10)} name="paidAt" type="date" />
                            <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={subscription.paymentMethod ?? ""} name="method" placeholder="Method" />
                            <input className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="reference" placeholder="Reference" />
                          </div>
                          <textarea className="min-h-20 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" name="note" placeholder="Payment note" />
                          <button className="inline-flex h-10 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background" type="submit">
                            Record payment
                          </button>
                        </form>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">You have view access to this outgoing, but not permission to record payments.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No business subscriptions tracked yet.</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="eyebrow">New outgoing</div>
          <h2 className="mt-3 text-xl font-semibold">Add a business subscription</h2>
          <p className="mt-2 text-sm text-muted-foreground">Track software, hosting, domains, tools, insurance, and other recurring business costs.</p>
          {canManage ? (
            <form action={createBusinessSubscriptionAction} className="mt-5 space-y-4" data-testid="new-outgoing-form">
              <div className="grid gap-4 lg:grid-cols-2">
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="vendorName" placeholder="Vendor" required />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="serviceName" placeholder="Service" required />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="category" placeholder="Category" />
                <select className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue="ACTIVE" name="status">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PAUSED">PAUSED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="EXPIRED">EXPIRED</option>
                </select>
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="supportEmail" placeholder="Support email" type="email" />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="accountNumber" placeholder="Account number" />
                <select className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="renewalOwnerUserId">
                  <option value="">Renewal owner</option>
                  {users.map((record) => (
                    <option key={record.id} value={record.id}>
                      {record.firstName} {record.lastName}
                    </option>
                  ))}
                </select>
                <select className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue="MONTHLY" name="frequency">
                  <option value="MONTHLY">MONTHLY</option>
                  <option value="QUARTERLY">QUARTERLY</option>
                  <option value="ANNUALLY">ANNUALLY</option>
                  <option value="CUSTOM">CUSTOM</option>
                </select>
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue="1" min="1" name="intervalCount" placeholder="Interval count" type="number" />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" min="0.01" name="amount" placeholder="Amount" required step="0.01" type="number" />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue="GBP" maxLength={3} name="currency" placeholder="Currency" />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={new Date().toISOString().slice(0, 10)} name="nextPaymentDate" required type="date" />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="renewalDate" type="date" />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="paymentMethod" placeholder="Payment method" />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="reference" placeholder="Reference / account ID" />
                <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm lg:col-span-2" name="website" placeholder="Website or portal URL" />
                <input
                  className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm lg:col-span-2"
                  defaultValue="14, 7, 3"
                  name="reminderDaysBefore"
                  placeholder="Reminder days before, comma separated"
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input defaultChecked name="autoNotify" type="checkbox" />
                Create internal reminders before this payment is due
              </label>
              <textarea className="min-h-28 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" name="notes" placeholder="Notes" />
              <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background" type="submit">
                Save outgoing subscription
              </button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">You have view access to outgoings, but not permission to manage them.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
