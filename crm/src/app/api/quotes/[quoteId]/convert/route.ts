import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { convertQuoteToInvoice } from "@/server/services/quotes";

export async function POST(_: Request, { params }: { params: Promise<{ quoteId: string }> }) {
  const user = await requireUser(PERMISSIONS.QUOTES_MANAGE);
  const { quoteId } = await params;

  try {
    const invoice = await convertQuoteToInvoice(quoteId, user.id);
    return NextResponse.json({ data: invoice }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to convert quote.";
    const status = message === "Quote not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
