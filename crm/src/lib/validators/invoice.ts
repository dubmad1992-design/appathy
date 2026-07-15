import { z } from "zod";

export const invoiceItemSchema = z.object({
  description: z.string().min(2),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  taxRate: z.coerce.number().min(0).max(100),
  discountAmount: z.coerce.number().min(0).default(0)
});

export const invoiceSchema = z.object({
  companyId: z.string().min(1),
  contactId: z.string().optional().nullable(),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  currency: z.string().default("GBP"),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1)
});

export const paymentSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]).optional().default("COMPLETED"),
  amount: z.coerce.number().positive(),
  paidAt: z.string().min(1),
  method: z.string().min(2),
  reference: z.string().optional(),
  reconciliationNote: z.string().optional()
});
