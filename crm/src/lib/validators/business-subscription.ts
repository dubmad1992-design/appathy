import { z } from "zod";

const optionalWebsiteSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}, z.string().url().optional().or(z.literal("")));

const optionalString = z.string().trim().optional().or(z.literal(""));

export const businessSubscriptionSchema = z.object({
  vendorName: z.string().trim().min(2),
  serviceName: z.string().trim().min(2),
  category: optionalString,
  supportEmail: optionalString.refine((value) => !value || z.string().email().safeParse(value).success, {
    message: "Invalid email address"
  }),
  accountNumber: optionalString,
  renewalOwnerUserId: optionalString,
  status: z.enum(["ACTIVE", "PAUSED", "CANCELLED", "EXPIRED"]).default("ACTIVE"),
  frequency: z.enum(["MONTHLY", "QUARTERLY", "ANNUALLY", "CUSTOM"]),
  intervalCount: z.coerce.number().int().min(1),
  amount: z.coerce.number().positive(),
  currency: z.string().trim().min(3).max(3).transform((value) => value.toUpperCase()),
  nextPaymentDate: z.string().min(1),
  renewalDate: optionalString,
  autoNotify: z.boolean().default(true),
  reminderDaysBefore: z.array(z.coerce.number().int().min(0).max(90)).min(1).default([14, 7, 3]),
  paymentMethod: optionalString,
  reference: optionalString,
  website: optionalWebsiteSchema,
  notes: optionalString
});

export const businessSubscriptionPaymentSchema = z.object({
  businessSubscriptionId: z.string().min(1),
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]).default("COMPLETED"),
  paidAt: z.string().min(1),
  amount: z.coerce.number().positive(),
  currency: z.string().trim().min(3).max(3).transform((value) => value.toUpperCase()),
  method: optionalString,
  reference: optionalString,
  note: optionalString
});
