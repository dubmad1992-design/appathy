import assert from "node:assert/strict";
import { InvoiceStatus, QuoteStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://crm.appathy.uk";

async function postWebhook(eventId: string, payload: unknown) {
  const response = await fetch(`${baseUrl}/api/webhooks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-provider": "qa",
      "x-webhook-event-id": eventId
    },
    body: JSON.stringify(payload)
  });

  return {
    status: response.status,
    json: (await response.json()) as Record<string, unknown>
  };
}

async function main() {
  const suffix = `webhook-${Date.now().toString().slice(-6)}`;
  let companyId: string | null = null;
  let contactId: string | null = null;
  let invoiceId: string | null = null;
  let failedInvoiceId: string | null = null;
  let quoteId: string | null = null;

  try {
    const company = await prisma.company.create({
      data: {
        name: `Webhook QA ${suffix}`,
        legalName: `Webhook QA ${suffix} Ltd`,
        billingEmail: `${suffix}@example.com`,
        billingPhone: "+44 113 777 1111"
      }
    });
    companyId = company.id;

    const contact = await prisma.contact.create({
      data: {
        companyId: company.id,
        firstName: "Webhook",
        lastName: "QA",
        email: `${suffix}@example.com`,
        isPrimary: true
      }
    });
    contactId = contact.id;

    const invoice = await prisma.invoice.create({
      data: {
        companyId: company.id,
        contactId: contact.id,
        number: `QA-WEBHOOK-${suffix}`,
        status: InvoiceStatus.SENT,
        currency: "GBP",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
        subtotalAmount: 100,
        taxAmount: 20,
        discountAmount: 0,
        totalAmount: 120,
        balanceDue: 120,
        items: {
          create: [
            {
              description: "Webhook payment success QA",
              quantity: 1,
              unitPrice: 100,
              taxRate: 20,
              discountAmount: 0,
              lineTotal: 100,
              sortOrder: 1
            }
          ]
        }
      }
    });
    invoiceId = invoice.id;

    const failedInvoice = await prisma.invoice.create({
      data: {
        companyId: company.id,
        contactId: contact.id,
        number: `QA-WEBHOOK-FAILED-${suffix}`,
        status: InvoiceStatus.SENT,
        currency: "GBP",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
        subtotalAmount: 200,
        taxAmount: 40,
        discountAmount: 0,
        totalAmount: 240,
        balanceDue: 240,
        items: {
          create: [
            {
              description: "Webhook payment failed QA",
              quantity: 1,
              unitPrice: 200,
              taxRate: 20,
              discountAmount: 0,
              lineTotal: 200,
              sortOrder: 1
            }
          ]
        }
      }
    });
    failedInvoiceId = failedInvoice.id;

    const quote = await prisma.quote.create({
      data: {
        companyId: company.id,
        contactId: contact.id,
        number: `QUO-QA-${suffix}`,
        status: QuoteStatus.SENT,
        currency: "GBP",
        issueDate: new Date(),
        expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
        subtotalAmount: 300,
        taxAmount: 60,
        discountAmount: 0,
        totalAmount: 360,
        items: {
          create: [
            {
              description: "Webhook quote acceptance QA",
              quantity: 1,
              unitPrice: 300,
              taxRate: 20,
              discountAmount: 0,
              lineTotal: 300,
              sortOrder: 1
            }
          ]
        }
      }
    });
    quoteId = quote.id;

    const invalid = await postWebhook(`${suffix}-invalid`, { type: "unknown", data: {} });
    assert.equal(invalid.status, 400, "Invalid webhook payload should be rejected.");

    const success = await postWebhook(`${suffix}-success`, {
      type: "invoice.payment_succeeded",
      data: {
        invoiceId: invoice.id,
        amount: 120,
        paidAt: new Date().toISOString(),
        method: "Card",
        reference: `${suffix}-SUCCESS`
      }
    });
    assert.equal(success.status, 200, "Payment success webhook should be accepted.");

    const duplicate = await postWebhook(`${suffix}-success`, {
      type: "invoice.payment_succeeded",
      data: {
        invoiceId: invoice.id,
        amount: 120,
        paidAt: new Date().toISOString(),
        method: "Card",
        reference: `${suffix}-SUCCESS`
      }
    });
    assert.equal(duplicate.status, 200, "Duplicate webhook should return 200.");
    assert.equal(duplicate.json.duplicate, true, "Duplicate webhook should be flagged as duplicate.");

    const updatedInvoice = await prisma.invoice.findUniqueOrThrow({
      where: { id: invoice.id },
      include: { payments: true }
    });
    assert.equal(updatedInvoice.status, InvoiceStatus.PAID, "Successful payment webhook should mark the invoice paid.");
    assert.equal(updatedInvoice.payments.length, 1, "Duplicate payment webhook should not create a second payment.");

    const failed = await postWebhook(`${suffix}-failed`, {
      type: "invoice.payment_failed",
      data: {
        invoiceId: failedInvoice.id,
        amount: 240,
        paidAt: new Date().toISOString(),
        method: "Card",
        reference: `${suffix}-FAILED`
      }
    });
    assert.equal(failed.status, 200, "Payment failed webhook should still be processed.");

    const failedPayment = await prisma.payment.findFirstOrThrow({
      where: {
        invoiceId: failedInvoice.id,
        reference: `${suffix}-FAILED`
      }
    });
    assert.equal(failedPayment.status, "FAILED", "Failed payment webhook should record a failed payment.");

    const accepted = await postWebhook(`${suffix}-quote-accepted`, {
      type: "quote.accepted",
      data: {
        quoteId: quote.id
      }
    });
    assert.equal(accepted.status, 200, "Quote acceptance webhook should be accepted.");

    const updatedQuote = await prisma.quote.findUniqueOrThrow({ where: { id: quote.id } });
    assert.equal(updatedQuote.status, QuoteStatus.ACCEPTED, "Quote acceptance webhook should update the quote status.");

    const webhookEvents = await prisma.webhookEvent.findMany({
      where: {
        provider: "qa",
        providerEventId: { startsWith: suffix }
      }
    });
    assert.equal(webhookEvents.length, 4, "Expected four stored webhook events after ignoring the duplicate event.");

    console.log("Webhook/payment-provider QA passed.");
  } finally {
    if (companyId) {
      const invoiceIds = [invoiceId, failedInvoiceId].filter(Boolean) as string[];
      if (invoiceIds.length) {
        await prisma.webhookEvent.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
        await prisma.communicationLog.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
        await prisma.payment.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
        await prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
        await prisma.invoice.deleteMany({ where: { id: { in: invoiceIds } } });
      }

      if (quoteId) {
        await prisma.webhookEvent.deleteMany({ where: { quoteId } });
        await prisma.quoteItem.deleteMany({ where: { quoteId } });
        await prisma.quote.delete({ where: { id: quoteId } });
      }

      if (contactId) {
        await prisma.contact.deleteMany({ where: { id: contactId } });
      }
      await prisma.company.delete({ where: { id: companyId } });
    }

    await prisma.webhookEvent.deleteMany({
      where: {
        provider: "qa",
        providerEventId: { startsWith: suffix }
      }
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
