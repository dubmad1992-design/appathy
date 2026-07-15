import { Card } from "@/components/ui/card";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getReportingData } from "@/server/queries/reporting";

export default async function ReportsPage() {
  await requireUser(PERMISSIONS.REPORTS_VIEW);
  const report = await getReportingData();

  return (
    <div className="space-y-4">
      <section className="grid gap-4 xl:grid-cols-4">
        <Card className="p-6">
          <div className="eyebrow">Cash In</div>
          <p className="mt-4 text-4xl font-semibold">{formatCurrency(report.metrics.collectionsThisMonth)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Customer payments received this month.</p>
        </Card>
        <Card className="p-6">
          <div className="eyebrow">Cash Out</div>
          <p className="mt-4 text-4xl font-semibold">{formatCurrency(report.metrics.outgoingPaymentsThisMonth)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Outgoing subscription payments recorded this month.</p>
        </Card>
        <Card className="p-6">
          <div className="eyebrow">Net Cash This Month</div>
          <p className="mt-4 text-4xl font-semibold">{formatCurrency(report.metrics.netCashThisMonth)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Collections minus outgoing payments for the current month.</p>
        </Card>
        <Card className="p-6">
          <div className="eyebrow">Net Cash YTD</div>
          <p className="mt-4 text-4xl font-semibold">{formatCurrency(report.metrics.netCashThisYear)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Year-to-date cash position after recorded outgoing payments.</p>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        <Card className="p-6">
          <div className="eyebrow">MRR</div>
          <p className="mt-4 text-3xl font-semibold">{formatCurrency(report.metrics.recurringMonthlyRevenue)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Normalized monthly recurring revenue across active services.</p>
        </Card>
        <Card className="p-6">
          <div className="eyebrow">Monthly Outgoings</div>
          <p className="mt-4 text-3xl font-semibold">{formatCurrency(report.metrics.recurringMonthlyOutgoing)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Normalized monthly cost across active business subscriptions.</p>
        </Card>
        <Card className="p-6">
          <div className="eyebrow">Recurring Margin</div>
          <p className="mt-4 text-3xl font-semibold">{formatCurrency(report.metrics.recurringMargin)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Monthly recurring revenue minus monthly recurring outgoings.</p>
        </Card>
        <Card className="p-6">
          <div className="eyebrow">Outgoing Due Next 30 Days</div>
          <p className="mt-4 text-3xl font-semibold">{formatCurrency(report.metrics.projectedOutgoingNext30Days)}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {report.metrics.outgoingsDueNext30Days} payment(s) due in the next 30 days.
          </p>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <div className="eyebrow">Collections trend</div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">12-month payment history</h2>
          <div className="mt-6">
            <RevenueChart data={report.collectionsSeries} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="eyebrow">Outgoing trend</div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">12-month outgoing payments</h2>
          <div className="mt-6">
            <RevenueChart data={report.outgoingSeries} />
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <div className="eyebrow">Spend by category</div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Monthly outgoing mix</h2>
          <div className="mt-5 space-y-3">
            {report.outgoingCategoryBreakdown.length ? (
              report.outgoingCategoryBreakdown.map((category) => (
                <div className="rounded-2xl border border-border/70 p-4" key={category.category}>
                  <p className="font-medium">{category.category}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{formatCurrency(category.value)} / month</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No outgoing categories recorded yet.</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="eyebrow">Recent outgoing payments</div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Latest recorded costs</h2>
          <div className="mt-5 space-y-3">
            {report.recentOutgoingPayments.length ? (
              report.recentOutgoingPayments.map((payment) => (
                <div className="rounded-2xl border border-border/70 p-4" key={payment.id}>
                  <p className="font-medium">{payment.businessSubscription.vendorName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{payment.businessSubscription.serviceName}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatCurrency(Number(payment.amount), payment.currency)} on {formatDate(payment.paidAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No outgoing payments recorded yet.</p>
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <Card className="p-6">
          <div className="eyebrow">Renewals this month</div>
          <p className="mt-4 text-3xl font-semibold">{formatCurrency(report.metrics.projectedRenewalValue)}</p>
          <div className="mt-4 space-y-3">
            {report.renewalsDueThisMonth.length ? (
              report.renewalsDueThisMonth.map((subscription) => (
                <div className="rounded-2xl border border-border/70 p-4" key={subscription.id}>
                  <p className="font-medium">{subscription.serviceName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{subscription.company.name}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Bills {formatDate(subscription.nextBillingDate)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No renewals due this month.</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="eyebrow">Upcoming outgoings</div>
          <div className="mt-4 space-y-3">
            {report.upcomingOutgoings.length ? (
              report.upcomingOutgoings.map((subscription) => (
                <div className="rounded-2xl border border-border/70 p-4" key={subscription.id}>
                  <p className="font-medium">{subscription.vendorName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{subscription.serviceName}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatCurrency(Number(subscription.amount), subscription.currency)} due {formatDate(subscription.nextPaymentDate)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No business outgoings due soon.</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="eyebrow">Customer value</div>
          <p className="mt-2 text-sm text-muted-foreground">Average customer lifetime value: {formatCurrency(report.metrics.averageLifetimeValue)}</p>
          <div className="mt-4 space-y-3">
            {report.topCustomers.length ? (
              report.topCustomers.map((customer) => (
                <div className="rounded-2xl border border-border/70 p-4" key={customer.name}>
                  <p className="font-medium">{customer.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{formatCurrency(customer.value)} collected</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No completed payments yet.</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="eyebrow">Invoice status breakdown</div>
          <div className="mt-4 grid gap-3">
            {report.invoiceBreakdown.map((item) => (
              <div className="rounded-2xl border border-border/70 p-4" key={item.status}>
                <p className="text-sm text-muted-foreground">{item.status}</p>
                <p className="mt-2 text-2xl font-semibold">{item._count}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
