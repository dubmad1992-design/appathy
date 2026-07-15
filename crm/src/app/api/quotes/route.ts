import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { prisma } from "@/lib/db/prisma";
import { quoteSchema } from "@/lib/validators/quote";
import { generateQuoteNumber } from "@/server/services/quote-number";

export async function GET() {
  await requireUser(PERMISSIONS.QUOTES_VIEW);
  const quotes = await prisma.quote.findMany({
    include: {
      company: true,
      contact: true,
      items: true,
      convertedInvoice: true
    },
    orderBy: { issueDate: "desc" }
  });

  return NextResponse.json({ data: quotes });
}

export async function POST(request: Request) {
  await requireUser(PERMISSIONS.QUOTES_MANAGE);
  const body = await request.json();
  const parsed = quoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const items = parsed.data.items.map((item) => {
    const lineTotal = item.quantity * item.unitPrice - item.discountAmount;
    const tax = lineTotal * (item.taxRate / 100);
    return { ...item, lineTotal, tax };
  });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const taxAmount = items.reduce((sum, item) => sum + item.tax, 0);
  const discountAmount = items.reduce((sum, item) => sum + item.discountAmount, 0);
  const totalAmount = subtotal + taxAmount;

  const quote = await prisma.quote.create({
    data: {
      number: await generateQuoteNumber(),
      companyId: parsed.data.companyId,
      contactId: parsed.data.contactId || null,
      currency: parsed.data.currency,
      issueDate: new Date(parsed.data.issueDate),
      expiryDate: new Date(parsed.data.expiryDate),
      notes: parsed.data.notes || null,
      terms: parsed.data.terms || null,
      subtotalAmount: subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      status: "DRAFT",
      items: {
        create: items.map((item, index) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          discountAmount: item.discountAmount,
          lineTotal: item.lineTotal,
          sortOrder: index + 1
        }))
      }
    },
    include: { items: true }
  });

  return NextResponse.json({ data: quote }, { status: 201 });
}
