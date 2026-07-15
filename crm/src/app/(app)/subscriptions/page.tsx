import { prisma } from "@/lib/db/prisma";
import { CompanyContactSelectFields } from "@/components/crm/company-contact-select-fields";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { createSubscriptionAction } from "@/server/actions/crm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getCrmLookups } from "@/server/queries/lookups";

export default async function SubscriptionsPage() {
  await requireUser(PERMISSIONS.SUBSCRIPTIONS_VIEW);
  const [subscriptions, lookups] = await Promise.all([
    prisma.subscription.findMany({
      include: { company: true, contact: true },
      orderBy: { nextBillingDate: "asc" }
    }),
    getCrmLookups()
  ]);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="p-6">
        <div className="eyebrow">Recurring services</div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Subscriptions, renewal dates, and recurring billing profiles</h1>
        <div className="mt-5 space-y-3">
          {subscriptions.map((subscription) => (
            <div className="rounded-2xl border border-border/70 p-4" key={subscription.id}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{subscription.serviceName}</p>
                  <p className="text-sm text-muted-foreground">{subscription.company.name}</p>
                </div>
                <div className="text-right text-sm">
                  <p>{formatCurrency(Number(subscription.amount), "GBP")}</p>
                  <p className="text-muted-foreground">{formatDate(subscription.nextBillingDate)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="eyebrow">New subscription</div>
        <form action={createSubscriptionAction} className="mt-5 space-y-4">
          <CompanyContactSelectFields
            companies={lookups.companies}
            companyPlaceholder="Company"
            contacts={lookups.contacts}
            contactPlaceholder="Contact"
            className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm"
          />
          <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="serviceName" placeholder="Service name" required />
          <textarea className="min-h-24 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" name="description" placeholder="Description" />
          <div className="grid gap-4 lg:grid-cols-2">
            <select className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="frequency">
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="ANNUALLY">Annually</option>
              <option value="CUSTOM">Custom</option>
            </select>
            <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue="1" name="intervalCount" placeholder="Interval count" />
            <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="amount" placeholder="Amount" />
            <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue="20" name="taxRate" placeholder="Tax rate" />
            <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={new Date().toISOString().slice(0, 10)} name="startDate" type="date" />
            <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={new Date().toISOString().slice(0, 10)} name="nextBillingDate" type="date" />
          </div>
          <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background" type="submit">
            Create subscription
          </button>
        </form>
      </Card>
    </div>
  );
}
