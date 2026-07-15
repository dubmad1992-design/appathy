import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function SubscriptionDetailPage({ params }: { params: Promise<{ subscriptionId: string }> }) {
  await requireUser(PERMISSIONS.SUBSCRIPTIONS_VIEW);
  const { subscriptionId } = await params;
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      company: true,
      contact: true,
      invoices: true,
      events: {
        orderBy: { occurredAt: "desc" }
      }
    }
  });

  if (!subscription) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="eyebrow">Subscription</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{subscription.serviceName}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{subscription.company.name}</p>
      </Card>
      <Card className="p-6">
        <div className="grid gap-4 lg:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="mt-2 font-semibold">{formatCurrency(Number(subscription.amount), "GBP")}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Frequency</p>
            <p className="mt-2 font-semibold">{subscription.frequency}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Next billing</p>
            <p className="mt-2 font-semibold">{formatDate(subscription.nextBillingDate)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="mt-2 font-semibold">{subscription.status}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
