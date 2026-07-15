import { z } from "zod";

export const webhookPayloadSchema = z.object({
  type: z.enum(["invoice.payment_succeeded", "invoice.payment_failed", "quote.accepted"]),
  data: z.object({
    invoiceId: z.string().optional(),
    quoteId: z.string().optional(),
    amount: z.coerce.number().positive().optional(),
    paidAt: z.string().optional(),
    method: z.string().optional(),
    reference: z.string().optional()
  })
});

