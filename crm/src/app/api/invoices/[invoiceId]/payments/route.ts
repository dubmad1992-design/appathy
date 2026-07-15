import { NextResponse } from "next/server";
import { PaymentStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { prisma } from "@/lib/db/prisma";
import { paymentSchema } from "@/lib/validators/invoice";
import { recordInvoicePayment } from "@/server/services/payments";

export async function POST(request: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
  const user = await requireUser(PERMISSIONS.PAYMENTS_MANAGE);
  const { invoiceId } = await params;
  const body = await request.json();
  const parsed = paymentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  const result = await recordInvoicePayment({
    invoiceId,
    recordedByUserId: user.id,
    status: parsed.data.status ?? PaymentStatus.COMPLETED,
    paidAt: new Date(parsed.data.paidAt),
    amount: parsed.data.amount,
    method: parsed.data.method,
    reference: parsed.data.reference || null,
    reconciliationNote: parsed.data.reconciliationNote || null
  });

  return NextResponse.json({ data: result.payment }, { status: 201 });
}
