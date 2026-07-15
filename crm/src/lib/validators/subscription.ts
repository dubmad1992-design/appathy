import { z } from "zod";

export const subscriptionSchema = z.object({
  companyId: z.string().min(1),
  contactId: z.string().optional().nullable(),
  serviceName: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "PAUSED", "CANCELLED", "EXPIRED"]).optional().default("ACTIVE"),
  frequency: z.enum(["MONTHLY", "QUARTERLY", "ANNUALLY", "CUSTOM"]),
  intervalCount: z.coerce.number().int().min(1).max(36),
  amount: z.coerce.number().positive(),
  taxRate: z.coerce.number().min(0).max(100),
  startDate: z.string().min(1),
  nextBillingDate: z.string().min(1),
  reminderOffsets: z.array(z.number()).default([14, 7, 0, -3, -7]),
  autoGenerateInvoice: z.coerce.boolean().optional().default(true),
  autoSendReminders: z.coerce.boolean().optional().default(true),
  cancelledAt: z.string().optional().nullable()
});
