import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { sendInvoiceDelivery } from "@/server/services/invoice-delivery";

export async function POST(_: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
  const user = await requireUser(PERMISSIONS.INVOICES_SEND);
  const { invoiceId } = await params;
  try {
    const updated = await sendInvoiceDelivery(invoiceId, user.id);
    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send invoice.";
    const status = message === "Invoice not found." ? 404 : message === "No customer email configured." ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
