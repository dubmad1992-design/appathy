import { z } from "zod";

export const businessSettingsSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  address: z.string().min(10),
  registrationNumber: z.string().optional(),
  vatNumber: z.string().optional()
});

export const billingSettingsSchema = z.object({
  invoicePrefix: z.string().min(2).max(8),
  defaultCurrency: z.string().length(3),
  defaultTaxRate: z.coerce.number().min(0).max(100),
  paymentTermsDays: z.coerce.number().int().min(1).max(90),
  paymentDetails: z.string().min(8)
});
