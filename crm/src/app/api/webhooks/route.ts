import { NextResponse } from "next/server";
import { PaymentStatus, QuoteStatus, WebhookEventStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { webhookPayloadSchema } from "@/lib/validators/webhook";
import { recordInvoicePayment } from "@/server/services/payments";

export async function POST(request: Request) {
  const provider = request.headers.get("x-webhook-provider") ?? "generic";
  const providerEventId = request.headers.get("x-webhook-event-id");
  const body = await request.json().catch(() => null);
  const parsed = webhookPayloadSchema.safeParse(body);

  if (!providerEventId) {
    return NextResponse.json({ error: "Missing webhook event id." }, { status: 400 });
  }

  if (!parsed.success) {
    await prisma.webhookEvent.create({
      data: {
        provider,
        providerEventId,
        eventType: "invalid_payload",
        status: WebhookEventStatus.FAILED,
        payload: body ?? {},
        processedAt: new Date(),
        errorMessage: "Webhook payload did not match the expected schema."
      }
    }).catch(() => null);

    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const duplicate = await prisma.webhookEvent.findUnique({
    where: {
      provider_providerEventId: {
        provider,
        providerEventId
      }
    }
  });

  if (duplicate) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const event = await prisma.webhookEvent.create({
    data: {
      provider,
      providerEventId,
      eventType: parsed.data.type,
      status: WebhookEventStatus.RECEIVED,
      payload: parsed.data
    }
  });

  try {
    if (parsed.data.type === "invoice.payment_succeeded") {
      if (!parsed.data.data.invoiceId || !parsed.data.data.amount || !parsed.data.data.paidAt || !parsed.data.data.method) {
        throw new Error("Missing invoice payment success fields.");
      }

      const result = await recordInvoicePayment({
        invoiceId: parsed.data.data.invoiceId,
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(parsed.data.data.paidAt),
        amount: parsed.data.data.amount,
        method: parsed.data.data.method,
        reference: parsed.data.data.reference ?? providerEventId,
        reconciliationNote: `Webhook payment success from ${provider}`
      });

      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          status: WebhookEventStatus.PROCESSED,
          invoiceId: result.invoice.id,
          paymentId: result.payment.id,
          processedAt: new Date()
        }
      });

      return NextResponse.json({ ok: true, paymentId: result.payment.id });
    }

    if (parsed.data.type === "invoice.payment_failed") {
      if (!parsed.data.data.invoiceId || !parsed.data.data.amount || !parsed.data.data.paidAt || !parsed.data.data.method) {
        throw new Error("Missing invoice payment failure fields.");
      }

      const result = await recordInvoicePayment({
        invoiceId: parsed.data.data.invoiceId,
        status: PaymentStatus.FAILED,
        paidAt: new Date(parsed.data.data.paidAt),
        amount: parsed.data.data.amount,
        method: parsed.data.data.method,
        reference: parsed.data.data.reference ?? providerEventId,
        reconciliationNote: `Webhook payment failure from ${provider}`
      });

      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          status: WebhookEventStatus.PROCESSED,
          invoiceId: parsed.data.data.invoiceId,
          paymentId: result.payment.id,
          processedAt: new Date()
        }
      });

      return NextResponse.json({ ok: true, paymentId: result.payment.id });
    }

    if (!parsed.data.data.quoteId) {
      throw new Error("Missing quote id.");
    }

    const quote = await prisma.quote.update({
      where: { id: parsed.data.data.quoteId },
      data: {
        status: QuoteStatus.ACCEPTED,
        acceptedAt: new Date()
      }
    });

    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: {
        status: WebhookEventStatus.PROCESSED,
        quoteId: quote.id,
        processedAt: new Date()
      }
    });

    return NextResponse.json({ ok: true, quoteId: quote.id });
  } catch (error) {
    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: {
        status: WebhookEventStatus.FAILED,
        processedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "Unknown webhook processing error"
      }
    });

    return NextResponse.json({ error: error instanceof Error ? error.message : "Webhook processing failed." }, { status: 400 });
  }
}
