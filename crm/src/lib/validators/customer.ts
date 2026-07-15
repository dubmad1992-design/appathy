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

export const customerSchema = z.object({
  name: z.string().min(2),
  legalName: z.string().optional().or(z.literal("")),
  billingEmail: z.string().email(),
  billingPhone: z.string().min(7),
  website: optionalWebsiteSchema,
  tags: z.string().optional(),
  flags: z.string().optional(),
  notesSummary: z.string().optional()
});

const optionalString = z.string().optional().or(z.literal(""));

export const customerOnboardingSchema = customerSchema
  .extend({
    primaryContactFirstName: optionalString,
    primaryContactLastName: optionalString,
    primaryContactEmail: optionalString,
    primaryContactPhone: optionalString,
    primaryContactTitle: optionalString
  })
  .superRefine((value, ctx) => {
    const hasPrimaryContact = [
      value.primaryContactFirstName,
      value.primaryContactLastName,
      value.primaryContactEmail,
      value.primaryContactPhone,
      value.primaryContactTitle
    ].some((field) => field?.trim());

    if (!hasPrimaryContact) {
      return;
    }

    if (!value.primaryContactFirstName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Primary contact first name is required.",
        path: ["primaryContactFirstName"]
      });
    }

    if (!value.primaryContactLastName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Primary contact last name is required.",
        path: ["primaryContactLastName"]
      });
    }

    if (!value.primaryContactEmail?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Primary contact email is required.",
        path: ["primaryContactEmail"]
      });
      return;
    }

    if (!z.string().email().safeParse(value.primaryContactEmail.trim()).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Primary contact email is invalid.",
        path: ["primaryContactEmail"]
      });
    }
  });
