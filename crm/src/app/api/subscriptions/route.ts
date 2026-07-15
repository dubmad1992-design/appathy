import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { prisma } from "@/lib/db/prisma";
import { subscriptionSchema } from "@/lib/validators/subscription";

export async function GET() {
  await requireUser(PERMISSIONS.SUBSCRIPTIONS_VIEW);
  const subscriptions = await prisma.subscription.findMany({
    include: {
      company: true,
      contact: true,
      invoices: true
    },
    orderBy: { nextBillingDate: "asc" }
  });

  return NextResponse.json({ data: subscriptions });
}

export async function POST(request: Request) {
  await requireUser(PERMISSIONS.SUBSCRIPTIONS_MANAGE);
  const body = await request.json();
  const parsed = subscriptionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const subscription = await prisma.subscription.create({
    data: {
      companyId: parsed.data.companyId,
      contactId: parsed.data.contactId || null,
      serviceName: parsed.data.serviceName,
      description: parsed.data.description || null,
      frequency: parsed.data.frequency,
      intervalCount: parsed.data.intervalCount,
      amount: parsed.data.amount,
      taxRate: parsed.data.taxRate,
      startDate: new Date(parsed.data.startDate),
      nextBillingDate: new Date(parsed.data.nextBillingDate),
      reminderOffsets: parsed.data.reminderOffsets
    }
  });

  return NextResponse.json({ data: subscription }, { status: 201 });
}
