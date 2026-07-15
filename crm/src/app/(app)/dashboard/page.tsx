import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/crm/metric-card";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getDashboardData } from "@/server/queries/dashboard";

export default async function DashboardPage() {
  await requireUser(PERMISSIONS.DASHBOARD_VIEW);
  const data = await getDashboardData();

  return (
    <div className="space-y-4">
      <section className="grid gap-4 xl:grid-cols-3">
        <MetricCard label="Total customers" value={String(data.metrics.totalCustomers)} helper="Companies actively managed in the CRM." />
        <MetricCard label="Active subscriptions" value={String(data.metrics.activeSubscriptions)} helper="Recurring services currently billing." />
        <MetricCard label="Active outgoings" value={String(data.metrics.activeOutgoingSubscriptions)} helper="Recurring subscriptions your business pays for." />
        <MetricCard label="Unpaid invoices" value={String(data.metrics.unpaidInvoices)} helper={`${data.metrics.overdueInvoices} overdue right now.`} />
        <MetricCard label="Revenue this month" value={formatCurrency(data.metrics.revenueThisMonth)} />
        <MetricCard label="Outgoings this month" value={formatCurrency(data.metrics.outgoingsThisMonth)} />
        <MetricCard label="Net this month" value={formatCurrency(data.metrics.netThisMonth)} helper="Cash in minus recorded outgoing payments." />
        <MetricCard label="Recurring margin" value={formatCurrency(data.metrics.recurringMargin)} helper="Recurring revenue minus monthly outgoings." />
        <MetricCard label="Revenue this year" value={formatCurrency(data.metrics.revenueThisYear)} />
        <MetricCard label="Reminder queue" value={String(data.reminderQueue.reduce((sum, item) => sum + item._count, 0))} helper="Jobs waiting, sent, skipped, or failed." />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr_0.9fr]">
        <Card className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="eyebrow">Revenue</div>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight">Collections trend</h3>
            </div>
          </div>
          <RevenueChart data={data.revenueSeries} />
        </Card>

        <Card className="p-6">
          <div className="eyebrow">Upcoming renewals</div>
          <div className="mt-4 space-y-4">
            {data.upcomingRenewals.map((subscription) => (
              <div className="rounded-2xl border border-border/70 p-4" key={subscription.id}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{subscription.serviceName}</p>
                    <p className="text-sm text-muted-foreground">{subscription.company.name}</p>
                  </div>
                  <Badge tone="warning">{formatDate(subscription.nextBillingDate)}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="eyebrow">Outgoing payments</div>
          <div className="mt-4 space-y-4">
            {data.upcomingOutgoings.length ? (
              data.upcomingOutgoings.map((subscription) => (
                <div className="rounded-2xl border border-border/70 p-4" key={subscription.id}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{subscription.vendorName}</p>
                      <p className="text-sm text-muted-foreground">{subscription.serviceName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(Number(subscription.amount), subscription.currency)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(subscription.nextPaymentDate)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No outgoing payments due in the next 30 days.</p>
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="p-6">
          <div className="eyebrow">Recent activity</div>
          <div className="mt-4 space-y-3">
            {data.recentActivity.map((item) => (
              <div className="rounded-2xl border border-border/70 p-4" key={item.id}>
                <p className="font-medium">{item.summary}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.action} on {formatDate(item.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-6">
            <div className="eyebrow">Due tasks</div>
            <div className="mt-4 space-y-3">
              {data.tasks.map((task) => (
                <div className="rounded-2xl border border-border/70 p-4" key={task.id}>
                  <p className="font-medium">{task.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{task.company?.name ?? "Internal task"}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Assigned to {task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : "Unassigned"}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <div className="eyebrow">Notifications</div>
            <div className="mt-4 space-y-3">
              {data.notifications.map((notification) => (
                <div className="rounded-2xl border border-border/70 p-4" key={notification.id}>
                  <p className="font-medium">{notification.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
