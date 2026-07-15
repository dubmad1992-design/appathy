import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { formatDateTime } from "@/lib/utils";

export default async function NotificationsPage() {
  await requireUser(PERMISSIONS.NOTIFICATIONS_VIEW);
  const notifications = await prisma.notification.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <Card className="p-6">
      <div className="eyebrow">Notifications</div>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">In-app alerts for renewals, collections, and operational issues</h1>
      <div className="mt-5 space-y-3">
        {notifications.map((notification) => (
          <div className="rounded-2xl border border-border/70 p-4" key={notification.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{notification.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
                {notification.actionUrl ? (
                  <Link className="mt-3 inline-flex text-sm font-medium text-primary" href={notification.actionUrl}>
                    Open related section
                  </Link>
                ) : null}
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>{notification.user.firstName}</p>
                <p>{formatDateTime(notification.createdAt)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
