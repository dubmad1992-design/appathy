import { prisma } from "@/lib/db/prisma";
import { serialize } from "@/lib/utils";

export async function getInvoiceList() {
  const invoices = await prisma.invoice.findMany({
    include: {
      company: true,
      contact: true,
      payments: true
    },
    orderBy: { issueDate: "desc" }
  });

  return serialize(invoices);
}

export async function getInvoiceDetail(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      company: true,
      contact: true,
      sourceQuote: true,
      items: {
        orderBy: { sortOrder: "asc" }
      },
      payments: {
        orderBy: { paidAt: "desc" }
      },
      emailLogs: {
        orderBy: { createdAt: "desc" }
      },
      communicationLogs: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  return invoice ? serialize(invoice) : null;
}
