import { z } from "zod";

export const emailTemplateSchema = z.object({
  templateId: z.string().min(1),
  name: z.string().min(2).max(120),
  subject: z.string().min(3).max(200),
  bodyHtml: z.string().min(10).max(20000),
  bodyText: z.string().min(10).max(10000),
  isActive: z.boolean().default(true)
});
