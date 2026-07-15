import { z } from "zod";

export const customerNoteSchema = z.object({
  body: z.string().min(2),
  contactId: z.string().optional().nullable(),
  invoiceId: z.string().optional().nullable(),
  subscriptionId: z.string().optional().nullable()
});
