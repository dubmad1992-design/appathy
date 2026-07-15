import { NextResponse } from "next/server";
import { InvoiceStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { prisma } from "@/lib/db/prisma";
import { invoiceSchema } from "@/lib/validators/invoice";
import { generateInvoiceNumber } from "@/server/services/invoice-number";

export async function GET() {
  await requireUser(PERMISSIONS.INVOICES_VIEW);
  const invoices = await prisma.invoice.findMany({
    include: {
      company: true,
      contact: true,
      items: true,
      payments: true
    },
    orderBy: { issueDate: "desc" }
  });

  return NextResponse.json({ data: invoices });
}

export async function POST(request: Request) {
  await requireUser(PERMISSIONS.INVOICES_MANAGE);
  const body = await request.json();
  const parsed = invoiceSchema.safeParse(body);

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

  const invoice = await prisma.invoice.create({
    data: {
      number: await generateInvoiceNumber(),
      companyId: parsed.data.companyId,
      contactId: parsed.data.contactId || null,
      currency: parsed.data.currency,
      issueDate: new Date(parsed.data.issueDate),
      dueDate: new Date(parsed.data.dueDate),
      notes: parsed.data.notes || null,
      terms: parsed.data.terms || null,
      subtotalAmount: subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      balanceDue: totalAmount,
      status: InvoiceStatus.DRAFT,
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

  return NextResponse.json({ data: invoice }, { status: 201 });
}
