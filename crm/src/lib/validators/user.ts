import { z } from "zod";

export const userCreateSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(10),
  jobTitle: z.string().optional(),
  roleId: z.string().min(1),
  status: z.enum(["ACTIVE", "INVITED", "DISABLED"]).default("ACTIVE")
});

export const userUpdateSchema = z.object({
  roleId: z.string().min(1).optional(),
  status: z.enum(["ACTIVE", "INVITED", "DISABLED"]).optional(),
  jobTitle: z.string().optional()
});
