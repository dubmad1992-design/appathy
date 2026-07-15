import { InvoiceStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { startOfDay } from "@/lib/utils";

type RecordInvoicePaymentInput = {
  invoiceId: string;
  amount: number;
  paidAt: Date;
  method: string;
  reference?: string | null;
  reconciliationNote?: string | null;
  recordedByUserId?: string | null;
  status?: PaymentStatus;
};

export async function recordInvoicePayment(input: RecordInvoicePaymentInput) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: input.invoiceId }
  });

  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  const paymentStatus = input.status ?? PaymentStatus.COMPLETED;

  const payment = await prisma.payment.create({
    data: {
      invoiceId: input.invoiceId,
      recordedByUserId: input.recordedByUserId ?? null,
      status: paymentStatus,
      paidAt: input.paidAt,
      amount: input.amount,
      method: input.method,
      reference: input.reference ?? null,
      reconciliationNote: input.reconciliationNote ?? null
    }
  });

  let updatedInvoice = invoice;

  if (paymentStatus === PaymentStatus.COMPLETED) {
    const newBalance = Number(invoice.balanceDue) - input.amount;
    const isOverdueAfterPayment = new Date(invoice.dueDate) < startOfDay(input.paidAt);

    updatedInvoice = await prisma.invoice.update({
      where: { id: input.invoiceId },
      data: {
        balanceDue: Math.max(newBalance, 0),
        paidAt: newBalance <= 0 ? input.paidAt : null,
        status: newBalance <= 0 ? InvoiceStatus.PAID : isOverdueAfterPayment ? InvoiceStatus.OVERDUE : InvoiceStatus.PARTIAL
      }
    });
  } else if (paymentStatus === PaymentStatus.FAILED) {
    await prisma.communicationLog.create({
      data: {
        companyId: invoice.companyId,
        contactId: invoice.contactId,
        invoiceId: invoice.id,
        type: "SYSTEM",
        title: `Failed payment recorded for ${invoice.number}`,
        body: input.reference || input.reconciliationNote || "A failed payment attempt was logged."
      }
    });
  }

  return { payment, invoice: updatedInvoice };
}

