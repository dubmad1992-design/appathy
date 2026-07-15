import { z } from "zod";

const optionalString = z.string().trim().optional().or(z.literal(""));

export const contactSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  alternateEmail: optionalString.refine((value) => !value || z.string().email().safeParse(value).success, {
    message: "Invalid email address"
  }),
  phone: optionalString,
  mobile: optionalString,
  title: optionalString,
  department: optionalString,
  status: z.enum(["ACTIVE", "INACTIVE", "LEAD"]).default("ACTIVE"),
  isPrimary: z.boolean().default(false),
  billingPreference: optionalString,
  tags: z.string().optional(),
  flags: z.string().optional()
});
