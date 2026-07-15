import { AppStatus, EnquiryStatus, Role } from "@prisma/client";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  remember: z.boolean().default(true)
});

export const contactSchema = z.object({
  name: z.string().min(2, "Name is required."),
  email: z.string().email("A valid email is required."),
  company: z.string().optional().or(z.literal("")),
  interestType: z.string().min(2, "Select an interest type."),
  message: z.string().min(10, "Tell Appathy a little more about the project."),
  // Honeypot: hidden from humans, so any value means an automated sender.
  website: z.string().optional()
});

export const appSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().min(2),
  category: z.string().min(2),
  shortDescription: z.string().min(10),
  longDescription: z.string().min(20),
  status: z.nativeEnum(AppStatus),
  versionNotes: z.string().optional().or(z.literal("")),
  internalNotes: z.string().optional().or(z.literal("")),
  logoUrl: z.string().optional().or(z.literal("")),
  screenshots: z.string().optional().or(z.literal("")),
  liveUrl: z.string().url().optional().or(z.literal("")),
  stagingUrl: z.string().url().optional().or(z.literal("")),
  adminUrl: z.string().url().optional().or(z.literal("")),
  repositoryUrl: z.string().url().optional().or(z.literal("")),
  featured: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  processName: z.string().optional().or(z.literal("")),
  deployPath: z.string().optional().or(z.literal("")),
  runtime: z.string().optional().or(z.literal("")),
  port: z.coerce.number().int().optional().nullable(),
  healthUrl: z.string().url().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().default(0)
});

export const serviceSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2),
  slug: z.string().min(2),
  shortDescription: z.string().min(10),
  startingPrice: z.string().optional().or(z.literal("")),
  ctaLabel: z.string().min(2),
  isVisible: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0)
});

export const faqSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(6),
  answer: z.string().min(10),
  isVisible: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0)
});

export const testimonialSchema = z.object({
  id: z.string().optional(),
  quote: z.string().min(10),
  authorName: z.string().min(2),
  role: z.string().min(2),
  company: z.string().min(2),
  isVisible: z.boolean().default(true)
});

export const settingsSchema = z.object({
  siteName: z.string().min(2),
  siteTagline: z.string().min(10),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional().or(z.literal("")),
  socialLinkedIn: z.string().url().optional().or(z.literal("")),
  socialX: z.string().url().optional().or(z.literal("")),
  socialGithub: z.string().url().optional().or(z.literal("")),
  seoTitleDefault: z.string().min(2),
  seoDescription: z.string().min(10),
  footerBlurb: z.string().min(10),
  analyticsSnippet: z.string().optional().or(z.literal(""))
});

export const homepageSchema = z.object({
  heroEyebrow: z.string().min(2),
  heroTitle: z.string().min(8),
  heroDescription: z.string().min(20),
  primaryCtaLabel: z.string().min(2),
  secondaryCtaLabel: z.string().min(2),
  introTitle: z.string().min(2),
  introBody: z.string().min(10),
  aboutTitle: z.string().min(2),
  aboutBody: z.string().min(10),
  contactTitle: z.string().min(2),
  contactBody: z.string().min(10)
});

export const enquiryUpdateSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(EnquiryStatus),
  internalNotes: z.string().optional().or(z.literal(""))
});

export const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).optional().or(z.literal("")),
  role: z.nativeEnum(Role)
});
