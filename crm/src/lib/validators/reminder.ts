import { z } from "zod";

export const reminderRuleSchema = z.object({
  kind: z.enum([
    "INVOICE_PRE_DUE",
    "INVOICE_DUE_TODAY",
    "INVOICE_OVERDUE",
    "SUBSCRIPTION_RENEWAL",
    "FAILED_PAYMENT",
    "INTERNAL_ALERT"
  ]),
  daysOffset: z.coerce.number().int().min(-60).max(60),
  templateKey: z.string().min(2),
  isActive: z.boolean().default(true)
});

export const reminderRuleUpdateSchema = reminderRuleSchema.partial();
