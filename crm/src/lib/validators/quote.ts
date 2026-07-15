import { z } from "zod";

export const quoteItemSchema = z.object({
  description: z.string().min(2),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  taxRate: z.coerce.number().min(0).max(100),
  discountAmount: z.coerce.number().min(0).default(0)
});

export const quoteSchema = z.object({
  companyId: z.string().min(1),
  contactId: z.string().optional().nullable(),
  issueDate: z.string().min(1),
  expiryDate: z.string().min(1),
  currency: z.string().default("GBP"),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(quoteItemSchema).min(1)
});

export const quoteStatusSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "DECLINED", "CONVERTED", "EXPIRED"])
});

