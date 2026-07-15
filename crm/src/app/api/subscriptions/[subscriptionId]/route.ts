import { Prisma, SubscriptionEventType, SubscriptionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { prisma } from "@/lib/db/prisma";
import { subscriptionSchema } from "@/lib/validators/subscription";

export async function PATCH(request: Request, { params }: { params: Promise<{ subscriptionId: string }> }) {
  const user = await requireUser(PERMISSIONS.SUBSCRIPTIONS_MANAGE);
  const { subscriptionId } = await params;
  const body = await request.json();
  const parsed = subscriptionSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const current = await prisma.subscription.findUnique({
      where: { id: subscriptionId }
    });
    if (!current) {
      return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
    }

    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        ...parsed.data,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
        nextBillingDate: parsed.data.nextBillingDate ? new Date(parsed.data.nextBillingDate) : undefined,
        cancelledAt:
          parsed.data.status === SubscriptionStatus.CANCELLED
            ? parsed.data.cancelledAt
              ? new Date(parsed.data.cancelledAt)
              : new Date()
            : parsed.data.cancelledAt === null
              ? null
              : undefined
      }
    });

    if (parsed.data.status && parsed.data.status !== current.status) {
      const eventType =
        parsed.data.status === SubscriptionStatus.PAUSED
          ? SubscriptionEventType.PAUSED
          : parsed.data.status === SubscriptionStatus.CANCELLED
            ? SubscriptionEventType.CANCELLED
            : parsed.data.status === SubscriptionStatus.ACTIVE
              ? SubscriptionEventType.RESUMED
              : null;

      if (eventType) {
        await prisma.subscriptionEvent.create({
          data: {
            subscriptionId,
            createdByUserId: user.id,
            type: eventType,
            summary: `Subscription status changed from ${current.status} to ${parsed.data.status}.`
          }
        });
      }
    }

    return NextResponse.json({ data: subscription });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
    }

    throw error;
  }
}
