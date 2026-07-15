"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { InvoiceStatus, PaymentStatus, PortalAccessType, SubscriptionEventType, SubscriptionStatus } from "@prisma/client";
import type { z } from "zod";
import { hashPassword, requireUser } from "@/lib/auth/session";
import { PERMISSIONS, ROLE_KEYS } from "@/lib/constants/permissions";
import { prisma } from "@/lib/db/prisma";
import { businessSubscriptionPaymentSchema, businessSubscriptionSchema } from "@/lib/validators/business-subscription";
import { contactSchema } from "@/lib/validators/contact";
import { customerOnboardingSchema, customerSchema } from "@/lib/validators/customer";
import { emailTemplateSchema } from "@/lib/validators/email-template";
import { invoiceSchema, paymentSchema } from "@/lib/validators/invoice";
import { customerNoteSchema } from "@/lib/validators/note";
import { quoteSchema } from "@/lib/validators/quote";
import { reminderRuleSchema } from "@/lib/validators/reminder";
import { subscriptionSchema } from "@/lib/validators/subscription";
import { taskSchema } from "@/lib/validators/task";
import { userCreateSchema, userUpdateSchema } from "@/lib/validators/user";
import { businessSettingsSchema, billingSettingsSchema } from "@/lib/validators/settings";
import { logAudit } from "@/server/services/audit";
import { sendInvoiceDelivery } from "@/server/services/invoice-delivery";
import { generateInvoiceNumber } from "@/server/services/invoice-number";
import { issuePortalAccessToken } from "@/server/services/portal";
import { recordInvoicePayment } from "@/server/services/payments";
import { generateQuoteNumber } from "@/server/services/quote-number";
import { convertQuoteToInvoice } from "@/server/services/quotes";
import { advanceBillingDate } from "@/server/services/subscription-billing";

type InvoiceInput = z.infer<typeof invoiceSchema>;
type QuoteInput = z.infer<typeof quoteSchema>;
type SubscriptionInput = z.infer<typeof subscriptionSchema>;
type ContactInput = z.infer<typeof contactSchema>;
type BusinessSubscriptionInput = z.infer<typeof businessSubscriptionSchema>;
type BusinessSubscriptionPaymentInput = z.infer<typeof businessSubscriptionPaymentSchema>;

type CalculatedLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountAmount: number;
  lineTotal: number;
};

function buildPath(pathname: string, query?: Record<string, string | number | boolean | undefined>, hash?: string) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === false || value === null) {
      continue;
    }

    search.set(key, String(value));
  }

  const queryString = search.toString();
  return `${pathname}${queryString ? `?${queryString}` : ""}${hash ? `#${hash}` : ""}`;
}

function splitCommaSeparatedValue(value?: string) {
  return value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
}

function parseReminderOffsetsInput(value: FormDataEntryValue | null) {
  const parsed = String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item >= 0 && item <= 90);

  return parsed.length ? parsed : [14, 7, 3];
}

function hasPrimaryContactInput(input: {
  primaryContactFirstName?: string;
  primaryContactLastName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  primaryContactTitle?: string;
}) {
  return [
    input.primaryContactFirstName,
    input.primaryContactLastName,
    input.primaryContactEmail,
    input.primaryContactPhone,
    input.primaryContactTitle
  ].some((value) => value?.trim());
}

function buildContactRecordData(input: ContactInput, isPrimary: boolean) {
  return {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.trim(),
    alternateEmail: input.alternateEmail?.trim() || null,
    phone: input.phone?.trim() || null,
    mobile: input.mobile?.trim() || null,
    title: input.title?.trim() || null,
    department: input.department?.trim() || null,
    status: input.status,
    isPrimary,
    billingPreference: input.billingPreference?.trim() || null,
    tags: splitCommaSeparatedValue(input.tags),
    flags: splitCommaSeparatedValue(input.flags)
  };
}

function parseLineItems(formData: FormData) {
  const descriptions = formData.getAll("itemDescription").map((value) => String(value ?? "").trim());
  const quantities = formData.getAll("itemQuantity").map((value) => String(value ?? "").trim());
  const unitPrices = formData.getAll("itemUnitPrice").map((value) => String(value ?? "").trim());
  const taxRates = formData.getAll("itemTaxRate").map((value) => String(value ?? "").trim());
  const discountAmounts = formData.getAll("itemDiscountAmount").map((value) => String(value ?? "").trim());

  const length = Math.max(descriptions.length, quantities.length, unitPrices.length, taxRates.length, discountAmounts.length);

  return Array.from({ length }, (_, index) => ({
    description: descriptions[index] ?? "",
    quantity: quantities[index] ?? "",
    unitPrice: unitPrices[index] ?? "",
    taxRate: taxRates[index] ?? "",
    discountAmount: discountAmounts[index] ?? ""
  })).filter((item) => [item.description, item.quantity, item.unitPrice, item.taxRate, item.discountAmount].some(Boolean));
}

function calculateLineItemTotals(items: Array<{ description: string; quantity: number; unitPrice: number; taxRate: number; discountAmount: number }>) {
  return items.reduce(
    (acc, item) => {
      const lineTotal = item.quantity * item.unitPrice - item.discountAmount;
      const tax = lineTotal * (item.taxRate / 100);

      return {
        subtotal: acc.subtotal + lineTotal,
        tax: acc.tax + tax,
        discount: acc.discount + item.discountAmount,
        items: [...acc.items, { ...item, lineTotal }]
      };
    },
    {
      subtotal: 0,
      tax: 0,
      discount: 0,
      items: [] as CalculatedLineItem[]
    }
  );
}

function parseInvoiceInput(formData: FormData) {
  return invoiceSchema.safeParse({
    companyId: formData.get("companyId"),
    contactId: formData.get("contactId") || undefined,
    issueDate: formData.get("issueDate"),
    dueDate: formData.get("dueDate"),
    currency: formData.get("currency"),
    notes: formData.get("notes") || undefined,
    terms: formData.get("terms") || undefined,
    items: parseLineItems(formData)
  });
}

function parseQuoteInput(formData: FormData) {
  return quoteSchema.safeParse({
    companyId: formData.get("companyId"),
    contactId: formData.get("contactId") || undefined,
    issueDate: formData.get("issueDate"),
    expiryDate: formData.get("expiryDate"),
    currency: formData.get("currency"),
    notes: formData.get("notes") || undefined,
    terms: formData.get("terms") || undefined,
    items: parseLineItems(formData)
  });
}

function parseReminderOffsets(value: FormDataEntryValue | null) {
  const raw = String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item));

  return raw.length ? raw : [14, 7, 0, -3, -7];
}

function parseSubscriptionInput(formData: FormData) {
  const autoGenerateInvoice = formData.get("autoGenerateInvoice");
  const autoSendReminders = formData.get("autoSendReminders");

  return subscriptionSchema.safeParse({
    companyId: formData.get("companyId"),
    contactId: formData.get("contactId") || undefined,
    serviceName: formData.get("serviceName"),
    description: formData.get("description") || undefined,
    status: formData.get("status") || undefined,
    frequency: formData.get("frequency"),
    intervalCount: formData.get("intervalCount"),
    amount: formData.get("amount"),
    taxRate: formData.get("taxRate"),
    startDate: formData.get("startDate"),
    nextBillingDate: formData.get("nextBillingDate"),
    reminderOffsets: parseReminderOffsets(formData.get("reminderOffsets")),
    autoGenerateInvoice: autoGenerateInvoice == null ? undefined : autoGenerateInvoice === "on",
    autoSendReminders: autoSendReminders == null ? undefined : autoSendReminders === "on",
    cancelledAt: formData.get("cancelledAt") || undefined
  });
}

function parseBusinessSubscriptionInput(formData: FormData) {
  return businessSubscriptionSchema.safeParse({
    vendorName: formData.get("vendorName"),
    serviceName: formData.get("serviceName"),
    category: formData.get("category") || undefined,
    supportEmail: formData.get("supportEmail") || undefined,
    accountNumber: formData.get("accountNumber") || undefined,
    renewalOwnerUserId: formData.get("renewalOwnerUserId") || undefined,
    status: formData.get("status") || "ACTIVE",
    frequency: formData.get("frequency"),
    intervalCount: formData.get("intervalCount"),
    amount: formData.get("amount"),
    currency: formData.get("currency") || "GBP",
    nextPaymentDate: formData.get("nextPaymentDate"),
    renewalDate: formData.get("renewalDate") || undefined,
    autoNotify: formData.get("autoNotify") == null ? undefined : formData.get("autoNotify") === "on",
    reminderDaysBefore: parseReminderOffsetsInput(formData.get("reminderDaysBefore")),
    paymentMethod: formData.get("paymentMethod") || undefined,
    reference: formData.get("reference") || undefined,
    website: formData.get("website") || undefined,
    notes: formData.get("notes") || undefined
  });
}

function buildBusinessSubscriptionRecordData(data: BusinessSubscriptionInput) {
  return {
    vendorName: data.vendorName,
    serviceName: data.serviceName,
    category: data.category || null,
    supportEmail: data.supportEmail || null,
    accountNumber: data.accountNumber || null,
    renewalOwnerUserId: data.renewalOwnerUserId || null,
    status: data.status,
    frequency: data.frequency,
    intervalCount: data.intervalCount,
    amount: data.amount,
    currency: data.currency,
    nextPaymentDate: new Date(data.nextPaymentDate),
    renewalDate: data.renewalDate ? new Date(data.renewalDate) : null,
    autoNotify: data.autoNotify,
    reminderDaysBefore: data.reminderDaysBefore,
    paymentMethod: data.paymentMethod || null,
    reference: data.reference || null,
    website: data.website || null,
    notes: data.notes || null
  };
}

function parseBusinessSubscriptionPaymentInput(formData: FormData) {
  return businessSubscriptionPaymentSchema.safeParse({
    businessSubscriptionId: formData.get("businessSubscriptionId"),
    status: formData.get("status") || "COMPLETED",
    paidAt: formData.get("paidAt"),
    amount: formData.get("amount"),
    currency: formData.get("currency") || "GBP",
    method: formData.get("method") || undefined,
    reference: formData.get("reference") || undefined,
    note: formData.get("note") || undefined
  });
}

function buildBusinessSubscriptionPaymentData(data: BusinessSubscriptionPaymentInput, recordedByUserId: string) {
  return {
    businessSubscriptionId: data.businessSubscriptionId,
    recordedByUserId,
    status: data.status,
    paidAt: new Date(data.paidAt),
    amount: data.amount,
    currency: data.currency,
    method: data.method || null,
    reference: data.reference || null,
    note: data.note || null
  };
}

async function createInvoiceRecord(data: InvoiceInput) {
  const totals = calculateLineItemTotals(data.items);
  const total = totals.subtotal + totals.tax;

  return prisma.invoice.create({
    data: {
      number: await generateInvoiceNumber(),
      companyId: data.companyId,
      contactId: data.contactId || null,
      currency: data.currency,
      issueDate: new Date(data.issueDate),
      dueDate: new Date(data.dueDate),
      notes: data.notes || null,
      terms: data.terms || null,
      subtotalAmount: totals.subtotal,
      taxAmount: totals.tax,
      discountAmount: totals.discount,
      totalAmount: total,
      balanceDue: total,
      status: InvoiceStatus.DRAFT,
      items: {
        create: totals.items.map((item, index) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          discountAmount: item.discountAmount,
          lineTotal: item.lineTotal,
          sortOrder: index + 1
        }))
      }
    }
  });
}

async function updateInvoiceRecord(invoiceId: string, data: InvoiceInput) {
  const existing = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      payments: true
    }
  });

  if (!existing) {
    return null;
  }

  const totals = calculateLineItemTotals(data.items);
  const total = totals.subtotal + totals.tax;
  const completedPayments = existing.payments
    .filter((payment) => payment.status === PaymentStatus.COMPLETED)
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
  const balanceDue = Math.max(total - completedPayments, 0);

  const nextStatus =
    existing.status === InvoiceStatus.CANCELLED
      ? InvoiceStatus.CANCELLED
      : balanceDue === 0 && completedPayments > 0
        ? InvoiceStatus.PAID
        : completedPayments > 0
          ? InvoiceStatus.PARTIAL
          : existing.status;

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      contactId: data.contactId || null,
      currency: data.currency,
      issueDate: new Date(data.issueDate),
      dueDate: new Date(data.dueDate),
      notes: data.notes || null,
      terms: data.terms || null,
      subtotalAmount: totals.subtotal,
      taxAmount: totals.tax,
      discountAmount: totals.discount,
      totalAmount: total,
      balanceDue,
      status: nextStatus,
      items: {
        deleteMany: {},
        create: totals.items.map((item, index) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          discountAmount: item.discountAmount,
          lineTotal: item.lineTotal,
          sortOrder: index + 1
        }))
      }
    }
  });
}

async function createQuoteRecord(data: QuoteInput) {
  const totals = calculateLineItemTotals(data.items);

  return prisma.quote.create({
    data: {
      number: await generateQuoteNumber(),
      companyId: data.companyId,
      contactId: data.contactId || null,
      currency: data.currency,
      issueDate: new Date(data.issueDate),
      expiryDate: new Date(data.expiryDate),
      notes: data.notes || null,
      terms: data.terms || null,
      subtotalAmount: totals.subtotal,
      taxAmount: totals.tax,
      discountAmount: totals.discount,
      totalAmount: totals.subtotal + totals.tax,
      status: "DRAFT",
      items: {
        create: totals.items.map((item, index) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          discountAmount: item.discountAmount,
          lineTotal: item.lineTotal,
          sortOrder: index + 1
        }))
      }
    }
  });
}

async function updateQuoteRecord(quoteId: string, data: QuoteInput) {
  const existing = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      convertedInvoice: {
        select: { id: true }
      }
    }
  });

  if (!existing || existing.convertedInvoice) {
    return null;
  }

  const totals = calculateLineItemTotals(data.items);

  return prisma.quote.update({
    where: { id: quoteId },
    data: {
      contactId: data.contactId || null,
      currency: data.currency,
      issueDate: new Date(data.issueDate),
      expiryDate: new Date(data.expiryDate),
      notes: data.notes || null,
      terms: data.terms || null,
      subtotalAmount: totals.subtotal,
      taxAmount: totals.tax,
      discountAmount: totals.discount,
      totalAmount: totals.subtotal + totals.tax,
      items: {
        deleteMany: {},
        create: totals.items.map((item, index) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          discountAmount: item.discountAmount,
          lineTotal: item.lineTotal,
          sortOrder: index + 1
        }))
      }
    }
  });
}

async function createSubscriptionRecord(data: SubscriptionInput) {
  return prisma.subscription.create({
    data: {
      companyId: data.companyId,
      contactId: data.contactId || null,
      serviceName: data.serviceName,
      description: data.description || null,
      status: data.status ?? SubscriptionStatus.ACTIVE,
      frequency: data.frequency,
      intervalCount: data.intervalCount,
      amount: data.amount,
      taxRate: data.taxRate,
      startDate: new Date(data.startDate),
      nextBillingDate: new Date(data.nextBillingDate),
      reminderOffsets: data.reminderOffsets,
      autoGenerateInvoice: data.autoGenerateInvoice,
      autoSendReminders: data.autoSendReminders,
      cancelledAt: data.cancelledAt ? new Date(data.cancelledAt) : null
    }
  });
}

async function updateSubscriptionRecord(subscriptionId: string, data: SubscriptionInput, userId: string) {
  const existing = await prisma.subscription.findUnique({
    where: { id: subscriptionId }
  });

  if (!existing) {
    return null;
  }

  const subscription = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      contactId: data.contactId || null,
      serviceName: data.serviceName,
      description: data.description || null,
      status: data.status ?? existing.status,
      frequency: data.frequency,
      intervalCount: data.intervalCount,
      amount: data.amount,
      taxRate: data.taxRate,
      startDate: new Date(data.startDate),
      nextBillingDate: new Date(data.nextBillingDate),
      reminderOffsets: data.reminderOffsets,
      autoGenerateInvoice: data.autoGenerateInvoice,
      autoSendReminders: data.autoSendReminders,
      cancelledAt: data.cancelledAt ? new Date(data.cancelledAt) : data.status === SubscriptionStatus.CANCELLED ? new Date() : null
    }
  });

  if (subscription.status !== existing.status) {
    const eventType =
      subscription.status === SubscriptionStatus.PAUSED
        ? SubscriptionEventType.PAUSED
        : subscription.status === SubscriptionStatus.CANCELLED
          ? SubscriptionEventType.CANCELLED
          : subscription.status === SubscriptionStatus.ACTIVE
            ? SubscriptionEventType.RESUMED
            : null;

    if (eventType) {
      await prisma.subscriptionEvent.create({
        data: {
          subscriptionId: subscription.id,
          createdByUserId: userId,
          type: eventType,
          summary: `Subscription status changed from ${existing.status} to ${subscription.status}.`
        }
      });
    }
  }

  return subscription;
}

export async function createCompanyAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.COMPANIES_MANAGE);
  const parsed = customerOnboardingSchema.safeParse({
    name: formData.get("name"),
    legalName: formData.get("legalName"),
    billingEmail: formData.get("billingEmail"),
    billingPhone: formData.get("billingPhone"),
    website: formData.get("website"),
    tags: formData.get("tags"),
    flags: formData.get("flags") || undefined,
    notesSummary: formData.get("notesSummary"),
    primaryContactFirstName: formData.get("primaryContactFirstName"),
    primaryContactLastName: formData.get("primaryContactLastName"),
    primaryContactEmail: formData.get("primaryContactEmail"),
    primaryContactPhone: formData.get("primaryContactPhone"),
    primaryContactTitle: formData.get("primaryContactTitle")
  });

  if (!parsed.success) {
    redirect("/customers?error=validation");
  }

  const company = await prisma.$transaction(async (tx) => {
    const createdCompany = await tx.company.create({
      data: {
        name: parsed.data.name,
        legalName: parsed.data.legalName || null,
        billingEmail: parsed.data.billingEmail,
        billingPhone: parsed.data.billingPhone,
        website: parsed.data.website || null,
        tags: splitCommaSeparatedValue(parsed.data.tags),
        flags: splitCommaSeparatedValue(parsed.data.flags),
        notesSummary: parsed.data.notesSummary || null
      }
    });

    if (hasPrimaryContactInput(parsed.data)) {
      await tx.contact.create({
        data: {
          companyId: createdCompany.id,
          firstName: parsed.data.primaryContactFirstName!.trim(),
          lastName: parsed.data.primaryContactLastName!.trim(),
          email: parsed.data.primaryContactEmail!.trim(),
          phone: parsed.data.primaryContactPhone?.trim() || null,
          title: parsed.data.primaryContactTitle?.trim() || null,
          status: "ACTIVE",
          isPrimary: true
        }
      });
    }

    return createdCompany;
  });

  await logAudit("company.created", "company", company.id, `Created company ${company.name}`, user.id);
  revalidatePath("/customers");
  redirect(`/customers/${company.id}`);
}

export async function createInvoiceAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.INVOICES_MANAGE);
  const parsed = parseInvoiceInput(formData);

  if (!parsed.success) {
    redirect("/invoices/new?error=validation");
  }

  const invoice = await createInvoiceRecord(parsed.data);

  await logAudit("invoice.created", "invoice", invoice.id, `Created draft invoice ${invoice.number}`, user.id);
  revalidatePath("/invoices");
  redirect(`/invoices/${invoice.id}`);
}

export async function recordPaymentAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.PAYMENTS_MANAGE);
  const invoiceId = String(formData.get("invoiceId"));
  const parsed = paymentSchema.safeParse({
    status: formData.get("status") || undefined,
    amount: formData.get("amount"),
    paidAt: formData.get("paidAt"),
    method: formData.get("method"),
    reference: formData.get("reference") || undefined,
    reconciliationNote: formData.get("reconciliationNote") || undefined
  });

  if (!parsed.success) {
    redirect(`/invoices/${invoiceId}?error=payment_validation`);
  }

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) {
    redirect("/invoices?error=missing_invoice");
  }

  await recordInvoicePayment({
    invoiceId,
    recordedByUserId: user.id,
    status: parsed.data.status ?? PaymentStatus.COMPLETED,
    paidAt: new Date(parsed.data.paidAt),
    amount: parsed.data.amount,
    method: parsed.data.method,
    reference: parsed.data.reference || null,
    reconciliationNote: parsed.data.reconciliationNote || null
  });

  await logAudit("payment.recorded", "invoice", invoiceId, `Recorded payment against ${invoice.number}`, user.id);
  revalidatePath(`/invoices/${invoiceId}`);
  redirect(`/invoices/${invoiceId}`);
}

export async function updateCompanyAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.COMPANIES_MANAGE);
  const companyId = String(formData.get("companyId") ?? "");
  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    legalName: formData.get("legalName"),
    billingEmail: formData.get("billingEmail"),
    billingPhone: formData.get("billingPhone"),
    website: formData.get("website"),
    tags: formData.get("tags") ?? "",
    flags: formData.get("flags") ?? "",
    notesSummary: formData.get("notesSummary")
  });

  if (!companyId || !parsed.success) {
    redirect(`/customers/${companyId || ""}?error=validation`);
  }

  const company = await prisma.company.update({
    where: { id: companyId },
    data: {
      name: parsed.data.name,
      legalName: parsed.data.legalName || null,
      billingEmail: parsed.data.billingEmail,
      billingPhone: parsed.data.billingPhone,
      website: parsed.data.website || null,
      tags: splitCommaSeparatedValue(typeof parsed.data.tags === "string" ? parsed.data.tags : undefined),
      flags: splitCommaSeparatedValue(typeof parsed.data.flags === "string" ? parsed.data.flags : undefined),
      notesSummary: parsed.data.notesSummary || null
    }
  });

  await logAudit("company.updated", "company", company.id, `Updated company ${company.name}`, user.id);
  revalidatePath("/customers");
  revalidatePath(`/customers/${company.id}`);
  redirect(`/customers/${company.id}?saved=1`);
}

export async function createCustomerContactAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.COMPANIES_MANAGE);
  const companyId = String(formData.get("companyId") ?? "");
  const parsed = contactSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    alternateEmail: formData.get("alternateEmail") || undefined,
    phone: formData.get("phone") || undefined,
    mobile: formData.get("mobile") || undefined,
    title: formData.get("title") || undefined,
    department: formData.get("department") || undefined,
    status: formData.get("status") || "ACTIVE",
    isPrimary: formData.get("isPrimary") === "on",
    billingPreference: formData.get("billingPreference") || undefined,
    tags: formData.get("tags") || undefined,
    flags: formData.get("flags") || undefined
  });

  if (!companyId || !parsed.success) {
    redirect(buildPath(`/customers/${companyId}`, { contactError: "validation" }, "contacts"));
  }

  const contact = await prisma.$transaction(async (tx) => {
    const existingCount = await tx.contact.count({ where: { companyId } });
    const shouldBePrimary = parsed.data.isPrimary || existingCount === 0;

    if (shouldBePrimary) {
      await tx.contact.updateMany({
        where: { companyId },
        data: { isPrimary: false }
      });
    }

    return tx.contact.create({
      data: {
        companyId,
        ...buildContactRecordData(parsed.data, shouldBePrimary)
      }
    });
  });

  await logAudit("contact.created", "contact", contact.id, `Created contact ${contact.firstName} ${contact.lastName}`, user.id);
  revalidatePath("/customers");
  revalidatePath(`/customers/${companyId}`);
  redirect(buildPath(`/customers/${companyId}`, { contactSaved: 1 }, "contacts"));
}

export async function updateCustomerContactAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.COMPANIES_MANAGE);
  const companyId = String(formData.get("companyId") ?? "");
  const contactId = String(formData.get("contactId") ?? "");
  const parsed = contactSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    alternateEmail: formData.get("alternateEmail") || undefined,
    phone: formData.get("phone") || undefined,
    mobile: formData.get("mobile") || undefined,
    title: formData.get("title") || undefined,
    department: formData.get("department") || undefined,
    status: formData.get("status") || "ACTIVE",
    isPrimary: formData.get("isPrimary") === "on",
    billingPreference: formData.get("billingPreference") || undefined,
    tags: formData.get("tags") || undefined,
    flags: formData.get("flags") || undefined
  });

  if (!companyId || !contactId || !parsed.success) {
    redirect(buildPath(`/customers/${companyId}`, { contactError: "validation" }, "contacts"));
  }

  const contact = await prisma.$transaction(async (tx) => {
    const existing = await tx.contact.findUnique({
      where: { id: contactId },
      select: { id: true, companyId: true }
    });

    if (!existing || existing.companyId !== companyId) {
      return null;
    }

    if (parsed.data.isPrimary) {
      await tx.contact.updateMany({
        where: {
          companyId,
          NOT: { id: contactId }
        },
        data: { isPrimary: false }
      });
    }

    return tx.contact.update({
      where: { id: contactId },
      data: buildContactRecordData(parsed.data, parsed.data.isPrimary)
    });
  });

  if (!contact) {
    redirect(buildPath(`/customers/${companyId}`, { contactError: "missing" }, "contacts"));
  }

  await logAudit("contact.updated", "contact", contact.id, `Updated contact ${contact.firstName} ${contact.lastName}`, user.id);
  revalidatePath("/customers");
  revalidatePath(`/customers/${companyId}`);
  redirect(buildPath(`/customers/${companyId}`, { contactSaved: 1 }, "contacts"));
}

export async function deleteCustomerContactAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.COMPANIES_MANAGE);
  const companyId = String(formData.get("companyId") ?? "");
  const contactId = String(formData.get("contactId") ?? "");

  if (!companyId || !contactId) {
    redirect(buildPath(`/customers/${companyId}`, { contactError: "missing" }, "contacts"));
  }

  const contact = await prisma.$transaction(async (tx) => {
    const existing = await tx.contact.findUnique({
      where: { id: contactId },
      select: {
        id: true,
        companyId: true,
        firstName: true,
        lastName: true,
        isPrimary: true
      }
    });

    if (!existing || existing.companyId !== companyId) {
      return null;
    }

    await tx.contact.delete({ where: { id: contactId } });

    if (existing.isPrimary) {
      const nextPrimary = await tx.contact.findFirst({
        where: { companyId },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }]
      });

      if (nextPrimary && !nextPrimary.isPrimary) {
        await tx.contact.update({
          where: { id: nextPrimary.id },
          data: { isPrimary: true }
        });
      }
    }

    return existing;
  });

  if (!contact) {
    redirect(buildPath(`/customers/${companyId}`, { contactError: "missing" }, "contacts"));
  }

  await logAudit("contact.deleted", "contact", contact.id, `Deleted contact ${contact.firstName} ${contact.lastName}`, user.id);
  revalidatePath("/customers");
  revalidatePath(`/customers/${companyId}`);
  redirect(buildPath(`/customers/${companyId}`, { contactDeleted: 1 }, "contacts"));
}

export async function deleteCompanyAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.COMPANIES_MANAGE);
  if (!user.roles.includes(ROLE_KEYS.ADMIN)) {
    redirect("/customers?error=forbidden");
  }

  const companyId = String(formData.get("companyId") ?? "");
  const confirmName = String(formData.get("confirmName") ?? "").trim();

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      contacts: { select: { id: true } },
      quotes: { select: { id: true } },
      subscriptions: { select: { id: true } },
      invoices: {
        select: {
          id: true,
          payments: { select: { id: true } }
        }
      }
    }
  });

  if (!company) {
    redirect("/customers?error=missing");
  }

  if (confirmName !== company.name) {
    redirect(`/customers/${company.id}?error=confirm_name`);
  }

  const contactIds = company.contacts.map((contact) => contact.id);
  const quoteIds = company.quotes.map((quote) => quote.id);
  const subscriptionIds = company.subscriptions.map((subscription) => subscription.id);
  const invoiceIds = company.invoices.map((invoice) => invoice.id);
  const paymentIds = company.invoices.flatMap((invoice) => invoice.payments.map((payment) => payment.id));

  await prisma.$transaction(async (tx) => {
    if (paymentIds.length) {
      await tx.webhookEvent.deleteMany({ where: { paymentId: { in: paymentIds } } });
    }
    if (invoiceIds.length) {
      await tx.webhookEvent.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      await tx.portalAccessToken.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      await tx.emailLog.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      await tx.reminderJob.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      await tx.communicationLog.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      await tx.document.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      await tx.note.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      await tx.task.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      await tx.payment.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      await tx.invoiceItem.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      await tx.invoice.deleteMany({ where: { id: { in: invoiceIds } } });
    }
    if (quoteIds.length) {
      await tx.webhookEvent.deleteMany({ where: { quoteId: { in: quoteIds } } });
      await tx.portalAccessToken.deleteMany({ where: { quoteId: { in: quoteIds } } });
      await tx.quoteItem.deleteMany({ where: { quoteId: { in: quoteIds } } });
      await tx.quote.deleteMany({ where: { id: { in: quoteIds } } });
    }
    if (subscriptionIds.length) {
      await tx.emailLog.deleteMany({ where: { subscriptionId: { in: subscriptionIds } } });
      await tx.reminderJob.deleteMany({ where: { subscriptionId: { in: subscriptionIds } } });
      await tx.communicationLog.deleteMany({ where: { subscriptionId: { in: subscriptionIds } } });
      await tx.document.deleteMany({ where: { subscriptionId: { in: subscriptionIds } } });
      await tx.note.deleteMany({ where: { subscriptionId: { in: subscriptionIds } } });
      await tx.task.deleteMany({ where: { subscriptionId: { in: subscriptionIds } } });
      await tx.subscriptionEvent.deleteMany({ where: { subscriptionId: { in: subscriptionIds } } });
      await tx.subscription.deleteMany({ where: { id: { in: subscriptionIds } } });
    }
    if (contactIds.length) {
      await tx.portalAccessToken.deleteMany({ where: { contactId: { in: contactIds } } });
      await tx.emailLog.deleteMany({ where: { contactId: { in: contactIds } } });
      await tx.reminderJob.deleteMany({ where: { contactId: { in: contactIds } } });
      await tx.communicationLog.deleteMany({ where: { contactId: { in: contactIds } } });
      await tx.document.deleteMany({ where: { contactId: { in: contactIds } } });
      await tx.note.deleteMany({ where: { contactId: { in: contactIds } } });
      await tx.task.deleteMany({ where: { contactId: { in: contactIds } } });
      await tx.address.deleteMany({ where: { contactId: { in: contactIds } } });
      await tx.contact.deleteMany({ where: { id: { in: contactIds } } });
    }

    await tx.portalAccessToken.deleteMany({ where: { companyId } });
    await tx.emailLog.deleteMany({ where: { companyId } });
    await tx.reminderJob.deleteMany({ where: { companyId } });
    await tx.communicationLog.deleteMany({ where: { companyId } });
    await tx.document.deleteMany({ where: { companyId } });
    await tx.note.deleteMany({ where: { companyId } });
    await tx.task.deleteMany({ where: { companyId } });
    await tx.address.deleteMany({ where: { companyId } });
    await tx.company.delete({ where: { id: companyId } });
  });

  await logAudit("company.deleted", "company", company.id, `Deleted company ${company.name}`, user.id);
  revalidatePath("/customers");
  redirect("/customers?deleted=1");
}

export async function sendInvoiceAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.INVOICES_SEND);
  const invoiceId = String(formData.get("invoiceId") ?? "");

  if (!invoiceId) {
    redirect("/invoices?error=missing_invoice");
  }

  let errorReason: string | null = null;

  try {
    await sendInvoiceDelivery(invoiceId, user.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "send_failed";
    errorReason = message === "No customer email configured." ? "missing_email" : message === "Invoice not found." ? "missing_invoice" : "send_failed";
  }

  revalidatePath(`/invoices/${invoiceId}`);
  redirect(errorReason ? `/invoices/${invoiceId}?error=${errorReason}` : `/invoices/${invoiceId}?sent=1`);
}

export async function createSubscriptionAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.SUBSCRIPTIONS_MANAGE);
  const parsed = parseSubscriptionInput(formData);

  if (!parsed.success) {
    redirect("/subscriptions?error=validation");
  }

  const subscription = await createSubscriptionRecord(parsed.data);

  await logAudit("subscription.created", "subscription", subscription.id, `Created subscription ${subscription.serviceName}`, user.id);
  revalidatePath("/subscriptions");
  redirect(`/subscriptions/${subscription.id}`);
}

export async function createQuoteAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.QUOTES_MANAGE);
  const parsed = parseQuoteInput(formData);

  if (!parsed.success) {
    redirect("/quotes?error=validation");
  }

  const quote = await createQuoteRecord(parsed.data);

  await logAudit("quote.created", "quote", quote.id, `Created draft quote ${quote.number}`, user.id);
  revalidatePath("/quotes");
  redirect("/quotes?saved=1");
}

export async function createCustomerQuoteAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.QUOTES_MANAGE);
  const companyId = String(formData.get("companyId") ?? "");

  if (!user.roles.includes(ROLE_KEYS.ADMIN)) {
    redirect(buildPath(`/customers/${companyId}`, { quoteError: "forbidden" }, "quotes"));
  }

  const parsed = parseQuoteInput(formData);
  if (!companyId || !parsed.success) {
    redirect(buildPath(`/customers/${companyId}`, { quoteError: "validation" }, "quotes"));
  }

  const quote = await createQuoteRecord(parsed.data);
  await logAudit("quote.created", "quote", quote.id, `Created draft quote ${quote.number}`, user.id);
  revalidatePath("/quotes");
  revalidatePath("/customers");
  revalidatePath(`/customers/${companyId}`);
  redirect(buildPath(`/customers/${companyId}`, { quoteSaved: 1 }, "quotes"));
}

export async function updateCustomerQuoteAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.QUOTES_MANAGE);
  const companyId = String(formData.get("companyId") ?? "");
  const quoteId = String(formData.get("quoteId") ?? "");

  if (!user.roles.includes(ROLE_KEYS.ADMIN)) {
    redirect(buildPath(`/customers/${companyId}`, { quoteError: "forbidden" }, "quotes"));
  }

  const parsed = parseQuoteInput(formData);
  if (!companyId || !quoteId || !parsed.success) {
    redirect(buildPath(`/customers/${companyId}`, { quoteError: "validation" }, "quotes"));
  }

  const quote = await updateQuoteRecord(quoteId, parsed.data);
  if (!quote) {
    redirect(buildPath(`/customers/${companyId}`, { quoteError: "missing" }, "quotes"));
  }

  await logAudit("quote.updated", "quote", quote.id, `Updated quote ${quote.number}`, user.id);
  revalidatePath("/quotes");
  revalidatePath(`/customers/${companyId}`);
  redirect(buildPath(`/customers/${companyId}`, { quoteSaved: 1 }, "quotes"));
}

export async function createCustomerInvoiceAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.INVOICES_MANAGE);
  const companyId = String(formData.get("companyId") ?? "");

  if (!user.roles.includes(ROLE_KEYS.ADMIN)) {
    redirect(buildPath(`/customers/${companyId}`, { invoiceError: "forbidden" }, "invoices"));
  }

  const parsed = parseInvoiceInput(formData);
  if (!companyId || !parsed.success) {
    redirect(buildPath(`/customers/${companyId}`, { invoiceError: "validation" }, "invoices"));
  }

  const invoice = await createInvoiceRecord(parsed.data);
  await logAudit("invoice.created", "invoice", invoice.id, `Created draft invoice ${invoice.number}`, user.id);
  revalidatePath("/invoices");
  revalidatePath("/customers");
  revalidatePath(`/customers/${companyId}`);
  redirect(buildPath(`/customers/${companyId}`, { invoiceSaved: 1 }, "invoices"));
}

export async function updateCustomerInvoiceAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.INVOICES_MANAGE);
  const companyId = String(formData.get("companyId") ?? "");
  const invoiceId = String(formData.get("invoiceId") ?? "");

  if (!user.roles.includes(ROLE_KEYS.ADMIN)) {
    redirect(buildPath(`/customers/${companyId}`, { invoiceError: "forbidden" }, "invoices"));
  }

  const parsed = parseInvoiceInput(formData);
  if (!companyId || !invoiceId || !parsed.success) {
    redirect(buildPath(`/customers/${companyId}`, { invoiceError: "validation" }, "invoices"));
  }

  const invoice = await updateInvoiceRecord(invoiceId, parsed.data);
  if (!invoice) {
    redirect(buildPath(`/customers/${companyId}`, { invoiceError: "missing" }, "invoices"));
  }

  await logAudit("invoice.updated", "invoice", invoice.id, `Updated invoice ${invoice.number}`, user.id);
  revalidatePath("/invoices");
  revalidatePath(`/customers/${companyId}`);
  redirect(buildPath(`/customers/${companyId}`, { invoiceSaved: 1 }, "invoices"));
}

export async function createCustomerSubscriptionAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.SUBSCRIPTIONS_MANAGE);
  const companyId = String(formData.get("companyId") ?? "");

  if (!user.roles.includes(ROLE_KEYS.ADMIN)) {
    redirect(buildPath(`/customers/${companyId}`, { subscriptionError: "forbidden" }, "subscriptions"));
  }

  const parsed = parseSubscriptionInput(formData);
  if (!companyId || !parsed.success) {
    redirect(buildPath(`/customers/${companyId}`, { subscriptionError: "validation" }, "subscriptions"));
  }

  const subscription = await createSubscriptionRecord(parsed.data);
  await logAudit("subscription.created", "subscription", subscription.id, `Created subscription ${subscription.serviceName}`, user.id);
  revalidatePath("/subscriptions");
  revalidatePath("/customers");
  revalidatePath(`/customers/${companyId}`);
  redirect(buildPath(`/customers/${companyId}`, { subscriptionSaved: 1 }, "subscriptions"));
}

export async function updateCustomerSubscriptionAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.SUBSCRIPTIONS_MANAGE);
  const companyId = String(formData.get("companyId") ?? "");
  const subscriptionId = String(formData.get("subscriptionId") ?? "");

  if (!user.roles.includes(ROLE_KEYS.ADMIN)) {
    redirect(buildPath(`/customers/${companyId}`, { subscriptionError: "forbidden" }, "subscriptions"));
  }

  const parsed = parseSubscriptionInput(formData);
  if (!companyId || !subscriptionId || !parsed.success) {
    redirect(buildPath(`/customers/${companyId}`, { subscriptionError: "validation" }, "subscriptions"));
  }

  const subscription = await updateSubscriptionRecord(subscriptionId, parsed.data, user.id);
  if (!subscription) {
    redirect(buildPath(`/customers/${companyId}`, { subscriptionError: "missing" }, "subscriptions"));
  }

  await logAudit("subscription.updated", "subscription", subscription.id, `Updated subscription ${subscription.serviceName}`, user.id);
  revalidatePath("/subscriptions");
  revalidatePath(`/customers/${companyId}`);
  redirect(buildPath(`/customers/${companyId}`, { subscriptionSaved: 1 }, "subscriptions"));
}

export async function createCustomerNoteAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.CUSTOMERS_MANAGE);
  const companyId = String(formData.get("companyId") ?? "");
  const parsed = customerNoteSchema.safeParse({
    body: formData.get("body"),
    contactId: formData.get("contactId") || undefined,
    invoiceId: formData.get("invoiceId") || undefined,
    subscriptionId: formData.get("subscriptionId") || undefined
  });

  if (!user.roles.includes(ROLE_KEYS.ADMIN)) {
    redirect(buildPath(`/customers/${companyId}`, { noteError: "forbidden" }, "notes"));
  }

  if (!companyId || !parsed.success) {
    redirect(buildPath(`/customers/${companyId}`, { noteError: "validation" }, "notes"));
  }

  const note = await prisma.note.create({
    data: {
      authorId: user.id,
      companyId,
      contactId: parsed.data.contactId || null,
      invoiceId: parsed.data.invoiceId || null,
      subscriptionId: parsed.data.subscriptionId || null,
      body: parsed.data.body
    }
  });

  await logAudit("note.created", "note", note.id, `Created internal note for customer workspace`, user.id);
  revalidatePath(`/customers/${companyId}`);
  redirect(buildPath(`/customers/${companyId}`, { noteSaved: 1 }, "notes"));
}

export async function updateCustomerNoteAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.CUSTOMERS_MANAGE);
  const companyId = String(formData.get("companyId") ?? "");
  const noteId = String(formData.get("noteId") ?? "");
  const parsed = customerNoteSchema.safeParse({
    body: formData.get("body"),
    contactId: formData.get("contactId") || undefined,
    invoiceId: formData.get("invoiceId") || undefined,
    subscriptionId: formData.get("subscriptionId") || undefined
  });

  if (!user.roles.includes(ROLE_KEYS.ADMIN)) {
    redirect(buildPath(`/customers/${companyId}`, { noteError: "forbidden" }, "notes"));
  }

  if (!companyId || !noteId || !parsed.success) {
    redirect(buildPath(`/customers/${companyId}`, { noteError: "validation" }, "notes"));
  }

  const note = await prisma.note.update({
    where: { id: noteId },
    data: {
      contactId: parsed.data.contactId || null,
      invoiceId: parsed.data.invoiceId || null,
      subscriptionId: parsed.data.subscriptionId || null,
      body: parsed.data.body
    }
  });

  await logAudit("note.updated", "note", note.id, `Updated internal note for customer workspace`, user.id);
  revalidatePath(`/customers/${companyId}`);
  redirect(buildPath(`/customers/${companyId}`, { noteSaved: 1 }, "notes"));
}

export async function convertQuoteAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.QUOTES_MANAGE);
  const quoteId = String(formData.get("quoteId") ?? "");

  if (!quoteId) {
    redirect("/quotes?error=missing");
  }

  let invoiceId: string | null = null;

  try {
    const invoice = await convertQuoteToInvoice(quoteId, user.id);
    invoiceId = invoice.id;
  } catch {
    redirect("/quotes?error=convert");
  }

  revalidatePath("/quotes");
  revalidatePath("/invoices");
  redirect(`/invoices/${invoiceId}`);
}

export async function createPortalLinkAction(formData: FormData) {
  const user = await requireUser();

  const portalType = String(formData.get("portalType") ?? "");
  const entityId = String(formData.get("entityId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "/dashboard");

  if (!entityId || !["invoice", "quote"].includes(portalType)) {
    redirect(`${returnTo}?error=portal`);
  }

  if (portalType === "invoice") {
    if (!user.permissions.includes(PERMISSIONS.INVOICES_SEND) && !user.permissions.includes(PERMISSIONS.INVOICES_MANAGE)) {
      redirect("/dashboard");
    }

    const invoice = await prisma.invoice.findUnique({ where: { id: entityId } });
    if (!invoice) {
      redirect(`${returnTo}?error=portal`);
    }

    if (invoice.status === InvoiceStatus.DRAFT) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: InvoiceStatus.SENT,
          sentAt: new Date()
        }
      });
    }

    const portal = await issuePortalAccessToken({
      type: PortalAccessType.INVOICE,
      companyId: invoice.companyId,
      contactId: invoice.contactId,
      invoiceId: invoice.id
    });

    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}portal=${encodeURIComponent(portal.url)}`);
  }

  if (!user.permissions.includes(PERMISSIONS.QUOTES_MANAGE)) {
    redirect("/dashboard");
  }

  const quote = await prisma.quote.findUnique({ where: { id: entityId } });
  if (!quote) {
    redirect(`${returnTo}?error=portal`);
  }

  if (quote.status === "DRAFT") {
    await prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: "SENT",
        sentAt: new Date()
      }
    });
  }

  const portal = await issuePortalAccessToken({
    type: PortalAccessType.QUOTE,
    companyId: quote.companyId,
    contactId: quote.contactId,
    quoteId: quote.id
  });

  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}portal=${encodeURIComponent(portal.url)}`);
}

export async function createTaskAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.TASKS_MANAGE);
  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    priority: formData.get("priority") || "MEDIUM",
    status: formData.get("status") || "OPEN",
    dueAt: formData.get("dueAt") || undefined,
    assignedToUserId: formData.get("assignedToUserId") || undefined,
    companyId: formData.get("companyId") || undefined,
    contactId: formData.get("contactId") || undefined,
    invoiceId: formData.get("invoiceId") || undefined,
    subscriptionId: formData.get("subscriptionId") || undefined
  });

  if (!parsed.success) {
    redirect("/tasks?error=validation");
  }

  await prisma.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      priority: parsed.data.priority,
      status: parsed.data.status,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
      assignedToUserId: parsed.data.assignedToUserId || null,
      companyId: parsed.data.companyId || null,
      contactId: parsed.data.contactId || null,
      invoiceId: parsed.data.invoiceId || null,
      subscriptionId: parsed.data.subscriptionId || null,
      createdByUserId: user.id
    }
  });

  revalidatePath("/tasks");
  redirect("/tasks");
}

export async function createBusinessSubscriptionAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.SUBSCRIPTIONS_MANAGE);
  const parsed = parseBusinessSubscriptionInput(formData);

  if (!parsed.success) {
    redirect("/outgoings?error=validation");
  }

  const subscription = await prisma.businessSubscription.create({
    data: buildBusinessSubscriptionRecordData(parsed.data)
  });

  await logAudit(
    "business_subscription.created",
    "business_subscription",
    subscription.id,
    `Created outgoing subscription ${subscription.vendorName} - ${subscription.serviceName}`,
    user.id
  );
  revalidatePath("/outgoings");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/notifications");
  redirect("/outgoings?saved=1");
}

export async function updateBusinessSubscriptionAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.SUBSCRIPTIONS_MANAGE);
  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  const parsed = parseBusinessSubscriptionInput(formData);

  if (!subscriptionId || !parsed.success) {
    redirect("/outgoings?error=validation");
  }

  const subscription = await prisma.businessSubscription.update({
    where: { id: subscriptionId },
    data: buildBusinessSubscriptionRecordData(parsed.data)
  });

  await logAudit(
    "business_subscription.updated",
    "business_subscription",
    subscription.id,
    `Updated outgoing subscription ${subscription.vendorName} - ${subscription.serviceName}`,
    user.id
  );
  revalidatePath("/outgoings");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/notifications");
  redirect("/outgoings?saved=1");
}

export async function deleteBusinessSubscriptionAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.SUBSCRIPTIONS_MANAGE);
  const subscriptionId = String(formData.get("subscriptionId") ?? "");

  if (!subscriptionId) {
    redirect("/outgoings?error=missing");
  }

  const subscription = await prisma.businessSubscription.delete({
    where: { id: subscriptionId }
  });

  await logAudit(
    "business_subscription.deleted",
    "business_subscription",
    subscription.id,
    `Deleted outgoing subscription ${subscription.vendorName} - ${subscription.serviceName}`,
    user.id
  );
  revalidatePath("/outgoings");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/notifications");
  redirect("/outgoings?deleted=1");
}

export async function recordBusinessSubscriptionPaymentAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.SUBSCRIPTIONS_MANAGE);
  const parsed = parseBusinessSubscriptionPaymentInput(formData);

  if (!parsed.success) {
    redirect("/outgoings?error=payment_validation");
  }

  const payment = await prisma.$transaction(async (tx) => {
    const createdPayment = await tx.businessSubscriptionPayment.create({
      data: buildBusinessSubscriptionPaymentData(parsed.data, user.id)
    });

    if (createdPayment.status === PaymentStatus.COMPLETED) {
      const subscription = await tx.businessSubscription.findUnique({
        where: { id: createdPayment.businessSubscriptionId }
      });

      if (subscription) {
        await tx.businessSubscription.update({
          where: { id: subscription.id },
          data: {
            nextPaymentDate: advanceBillingDate(subscription.nextPaymentDate, subscription.frequency, subscription.intervalCount)
          }
        });
      }
    }

    return createdPayment;
  });

  await logAudit(
    "business_subscription.payment_recorded",
    "business_subscription",
    payment.businessSubscriptionId,
    `Recorded ${payment.status.toLowerCase()} payment for outgoing subscription`,
    user.id
  );
  revalidatePath("/outgoings");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/notifications");
  redirect("/outgoings?paymentSaved=1");
}

export async function saveBusinessSettingsAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.SETTINGS_MANAGE);

  const business = businessSettingsSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    registrationNumber: formData.get("registrationNumber") || undefined,
    vatNumber: formData.get("vatNumber") || undefined
  });

  const billing = billingSettingsSchema.safeParse({
    invoicePrefix: formData.get("invoicePrefix"),
    defaultCurrency: formData.get("defaultCurrency"),
    defaultTaxRate: formData.get("defaultTaxRate"),
    paymentTermsDays: formData.get("paymentTermsDays"),
    paymentDetails: formData.get("paymentDetails")
  });

  if (!business.success || !billing.success) {
    redirect("/settings?error=validation");
  }

  await prisma.setting.upsert({
    where: {
      category_key: {
        category: "business",
        key: "profile"
      }
    },
    update: {
      value: business.data
    },
    create: {
      category: "business",
      key: "profile",
      value: business.data
    }
  });

  await prisma.setting.upsert({
    where: {
      category_key: {
        category: "billing",
        key: "defaults"
      }
    },
    update: {
      value: billing.data
    },
    create: {
      category: "billing",
      key: "defaults",
      value: billing.data
    }
  });

  await logAudit("settings.updated", "setting", "business+billing", "Updated business and billing settings", user.id);
  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

export async function saveEmailTemplateAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.SETTINGS_MANAGE);
  const parsed = emailTemplateSchema.safeParse({
    templateId: formData.get("templateId"),
    name: formData.get("name"),
    subject: formData.get("subject"),
    bodyHtml: formData.get("bodyHtml"),
    bodyText: formData.get("bodyText"),
    isActive: formData.get("isActive") === "on"
  });

  if (!parsed.success) {
    redirect("/settings?error=template_validation#email-templates");
  }

  const template = await prisma.emailTemplate.findUnique({
    where: { id: parsed.data.templateId }
  });
  if (!template) {
    redirect("/settings?error=template_missing#email-templates");
  }

  await prisma.emailTemplate.update({
    where: { id: parsed.data.templateId },
    data: {
      name: parsed.data.name,
      subject: parsed.data.subject,
      bodyHtml: parsed.data.bodyHtml,
      bodyText: parsed.data.bodyText,
      isActive: parsed.data.isActive
    }
  });

  await logAudit("email_template.updated", "email_template", template.id, `Updated email template ${template.key}`, user.id);
  revalidatePath("/settings");
  redirect(`/settings?saved=1#template-${template.key}`);
}

export async function createUserAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.USERS_MANAGE);
  const parsed = userCreateSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    jobTitle: formData.get("jobTitle") || undefined,
    roleId: formData.get("roleId"),
    status: formData.get("status") || "ACTIVE"
  });

  if (!parsed.success) {
    redirect("/users?error=validation");
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() }
  });
  if (existing) {
    redirect("/users?error=duplicate");
  }

  const role = await prisma.role.findUnique({
    where: { id: parsed.data.roleId }
  });
  if (!role) {
    redirect("/users?error=role");
  }

  const created = await prisma.user.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email.toLowerCase(),
      passwordHash: await hashPassword(parsed.data.password),
      jobTitle: parsed.data.jobTitle || null,
      status: parsed.data.status,
      userRoles: {
        create: [{ roleId: parsed.data.roleId }]
      }
    }
  });

  await logAudit("user.created", "user", created.id, `Created CRM user ${created.email}`, user.id);
  revalidatePath("/users");
  redirect("/users?saved=1");
}

export async function updateUserAccessAction(formData: FormData) {
  const actor = await requireUser(PERMISSIONS.USERS_MANAGE);
  const userId = String(formData.get("userId") ?? "");
  const parsed = userUpdateSchema.safeParse({
    roleId: formData.get("roleId") || undefined,
    status: formData.get("status") || undefined,
    jobTitle: formData.get("jobTitle") || undefined
  });

  if (!userId || !parsed.success) {
    redirect("/users?error=validation");
  }

  if (parsed.data.roleId) {
    const role = await prisma.role.findUnique({ where: { id: parsed.data.roleId } });
    if (!role) {
      redirect("/users?error=role");
    }
  }

  await prisma.$transaction(async (tx) => {
    if (parsed.data.roleId) {
      await tx.userRole.deleteMany({ where: { userId } });
      await tx.userRole.create({
        data: {
          userId,
          roleId: parsed.data.roleId
        }
      });
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        status: parsed.data.status,
        jobTitle: parsed.data.jobTitle
      }
    });
  });

  await logAudit("user.updated", "user", userId, "Updated user access settings", actor.id);
  revalidatePath("/users");
  redirect("/users?saved=1");
}

export async function saveReminderRuleAction(formData: FormData) {
  const user = await requireUser(PERMISSIONS.SETTINGS_MANAGE);
  const ruleId = String(formData.get("ruleId") ?? "");
  const parsed = reminderRuleSchema.safeParse({
    kind: formData.get("kind"),
    daysOffset: formData.get("daysOffset"),
    templateKey: formData.get("templateKey"),
    isActive: formData.get("isActive") === "on"
  });

  if (!parsed.success) {
    redirect("/settings?error=reminder_validation");
  }

  const template = await prisma.emailTemplate.findUnique({
    where: { key: parsed.data.templateKey }
  });
  if (!template) {
    redirect("/settings?error=template");
  }

  if (ruleId) {
    await prisma.reminderRule.update({
      where: { id: ruleId },
      data: parsed.data
    });
    await logAudit("reminder_rule.updated", "reminder_rule", ruleId, `Updated ${parsed.data.kind} reminder rule`, user.id);
  } else {
    const duplicate = await prisma.reminderRule.findFirst({
      where: {
        kind: parsed.data.kind,
        daysOffset: parsed.data.daysOffset
      }
    });
    if (duplicate) {
      redirect("/settings?error=duplicate_rule");
    }

    const rule = await prisma.reminderRule.create({
      data: parsed.data
    });
    await logAudit("reminder_rule.created", "reminder_rule", rule.id, `Created ${parsed.data.kind} reminder rule`, user.id);
  }

  revalidatePath("/settings");
  redirect("/settings?saved=1#reminder-rules");
}
