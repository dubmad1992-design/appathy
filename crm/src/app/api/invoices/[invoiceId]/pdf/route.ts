import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { prisma } from "@/lib/db/prisma";
import { generateInvoicePdf } from "@/server/services/pdf";

export async function GET(_: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
  await requireUser(PERMISSIONS.INVOICES_VIEW);
  const { invoiceId } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      company: true,
      items: {
        orderBy: { sortOrder: "asc" }
      }
    }
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  let pdfPath = invoice.pdfPath;
  if (!pdfPath) {
    const pdf = await generateInvoicePdf({
      invoice: {
        id: invoice.id,
        number: invoice.number,
        currency: invoice.currency,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        subtotalAmount: Number(invoice.subtotalAmount),
        taxAmount: Number(invoice.taxAmount),
        discountAmount: Number(invoice.discountAmount),
        totalAmount: Number(invoice.totalAmount),
        balanceDue: Number(invoice.balanceDue),
        paymentReference: invoice.paymentReference,
        notes: invoice.notes,
        terms: invoice.terms
      },
      company: {
        name: invoice.company.name,
        billingEmail: invoice.company.billingEmail
      },
      items: invoice.items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal)
      }))
    });
    pdfPath = pdf.relativePath;
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { pdfPath }
    });
  }

  const absolutePath = path.resolve(process.cwd(), "public", pdfPath.replace(/^\/uploads/, "uploads"));
  const file = await readFile(absolutePath);
  return new NextResponse(file, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.number}.pdf"`
    }
  });
}
