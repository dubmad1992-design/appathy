import { InvoiceStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { renderTemplate, sendEmail } from "@/server/services/email";
import { generateInvoicePdf } from "@/server/services/pdf";
import { logAudit } from "@/server/services/audit";
import { formatCurrency, formatDate } from "@/lib/utils";

export async function sendInvoiceDelivery(invoiceId: string, userId?: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      company: true,
      contact: true,
      items: {
        orderBy: { sortOrder: "asc" }
      }
    }
  });

  if (!invoice) {
    throw new Error("Invoice not found.");
  }

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

  const template = await prisma.emailTemplate.findUnique({
    where: { key: "new_invoice" }
  });

  if (!template) {
    throw new Error("Email template missing.");
  }

  const context = {
    business: {
      name: process.env.BUSINESS_NAME ?? "Appathy CRM"
    },
    contact: {
      firstName: invoice.contact?.firstName ?? "there"
    },
    invoice: {
      number: invoice.number,
      totalAmount: formatCurrency(Number(invoice.totalAmount), invoice.currency),
      dueDate: formatDate(invoice.dueDate)
    }
  };

  const toAddress = invoice.contact?.email ?? invoice.company.billingEmail;
  if (!toAddress) {
    throw new Error("No customer email configured.");
  }

  await sendEmail({
    to: toAddress,
    subject: renderTemplate(template.subject, context),
    html: renderTemplate(`${template.bodyHtml}<p>PDF: ${pdf.relativePath}</p>`, context),
    text: renderTemplate(template.bodyText, context),
    templateKey: template.key,
    companyId: invoice.companyId,
    contactId: invoice.contactId,
    invoiceId: invoice.id
  });

  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: invoice.status === InvoiceStatus.DRAFT ? InvoiceStatus.SENT : invoice.status,
      sentAt: new Date(),
      pdfPath: pdf.relativePath
    }
  });

  await prisma.communicationLog.create({
    data: {
      companyId: invoice.companyId,
      contactId: invoice.contactId,
      invoiceId: invoice.id,
      type: "EMAIL",
      title: `Invoice ${invoice.number} sent`,
      body: `Sent invoice email to ${toAddress}.`
    }
  });

  await logAudit("invoice.sent", "invoice", invoice.id, `Sent invoice ${invoice.number}`, userId);

  return updated;
}
