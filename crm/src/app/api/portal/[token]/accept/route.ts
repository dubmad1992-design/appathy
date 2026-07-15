import { NextResponse } from "next/server";
import { QuoteStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { resolvePortalAccessToken } from "@/server/services/portal";

export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const access = await resolvePortalAccessToken(token);

  if (!access?.quote) {
    return NextResponse.redirect(new URL(`/portal/${token}?error=missing`, process.env.NEXT_PUBLIC_APP_URL ?? "https://crm.appathy.uk"));
  }

  if (access.quote.status === QuoteStatus.ACCEPTED || access.quote.status === QuoteStatus.CONVERTED) {
    return NextResponse.redirect(new URL(`/portal/${token}?accepted=1`, process.env.NEXT_PUBLIC_APP_URL ?? "https://crm.appathy.uk"));
  }

  await prisma.quote.update({
    where: { id: access.quote.id },
    data: {
      status: QuoteStatus.ACCEPTED,
      acceptedAt: new Date()
    }
  });

  await prisma.auditLog.create({
    data: {
      action: "quote.accepted",
      entityType: "quote",
      entityId: access.quote.id,
      summary: `Quote ${access.quote.number} accepted through the customer portal`
    }
  });

  return NextResponse.redirect(new URL(`/portal/${token}?accepted=1`, process.env.NEXT_PUBLIC_APP_URL ?? "https://crm.appathy.uk"));
}
