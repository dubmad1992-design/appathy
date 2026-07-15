import { QuoteStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { generateInvoiceNumber } from "@/server/services/invoice-number";

export async function convertQuoteToInvoice(quoteId: string, userId?: string | null) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      convertedInvoice: true,
      items: {
        orderBy: { sortOrder: "asc" }
      }
    }
  });

  if (!quote) {
    throw new Error("Quote not found.");
  }

  if (quote.convertedInvoice) {
    throw new Error("Quote has already been converted.");
  }

  if (quote.status === QuoteStatus.DECLINED || quote.status === QuoteStatus.EXPIRED) {
    throw new Error("Quote is no longer eligible for conversion.");
  }

  const invoice = await prisma.invoice.create({
    data: {
      sourceQuoteId: quote.id,
      companyId: quote.companyId,
      contactId: quote.contactId,
      number: await generateInvoiceNumber(),
      status: "DRAFT",
      currency: quote.currency,
      issueDate: new Date(),
      dueDate: quote.expiryDate,
      notes: quote.notes,
      terms: quote.terms,
      subtotalAmount: quote.subtotalAmount,
      taxAmount: quote.taxAmount,
      discountAmount: quote.discountAmount,
      totalAmount: quote.totalAmount,
      balanceDue: quote.totalAmount,
      paymentReference: `From ${quote.number}`,
      items: {
        create: quote.items.map((item, index) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          discountAmount: item.discountAmount,
          lineTotal: item.lineTotal,
          sortOrder: index + 1
        }))
      }
    }
  });

  await prisma.quote.update({
    where: { id: quote.id },
    data: {
      status: QuoteStatus.CONVERTED,
      convertedAt: new Date()
    }
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: userId ?? null,
      action: "quote.converted",
      entityType: "quote",
      entityId: quote.id,
      summary: `Converted quote ${quote.number} to invoice ${invoice.number}`,
      metadata: { invoiceId: invoice.id }
    }
  });

  return invoice;
}
