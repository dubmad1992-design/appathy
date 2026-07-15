import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  await requireUser(PERMISSIONS.PAYMENTS_MANAGE);
  const payments = await prisma.payment.findMany({
    include: { invoice: true },
    orderBy: { paidAt: "desc" }
  });

  return NextResponse.json({ data: payments });
}
