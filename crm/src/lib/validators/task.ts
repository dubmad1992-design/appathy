import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  status: z.enum(["OPEN", "IN_PROGRESS", "BLOCKED", "DONE"]).default("OPEN"),
  dueAt: z.string().optional(),
  assignedToUserId: z.string().optional(),
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  invoiceId: z.string().optional(),
  subscriptionId: z.string().optional()
});
