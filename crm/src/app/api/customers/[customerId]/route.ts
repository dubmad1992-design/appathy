import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { prisma } from "@/lib/db/prisma";
import { customerSchema } from "@/lib/validators/customer";

export async function GET(_: Request, { params }: { params: Promise<{ customerId: string }> }) {
  await requireUser(PERMISSIONS.CUSTOMERS_VIEW);
  const { customerId } = await params;

  const company = await prisma.company.findUnique({
    where: { id: customerId },
    include: {
      contacts: true,
      invoices: true,
      subscriptions: true,
      notes: true,
      documents: true,
      communicationLogs: true
    }
  });

  if (!company) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  return NextResponse.json({ data: company });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ customerId: string }> }) {
  await requireUser(PERMISSIONS.COMPANIES_MANAGE);
  const { customerId } = await params;
  const body = await request.json();
  const parsed = customerSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const company = await prisma.company.update({
      where: { id: customerId },
      data: {
        ...parsed.data,
        tags: typeof parsed.data.tags === "string" ? parsed.data.tags.split(",").map((item) => item.trim()).filter(Boolean) : undefined,
        flags: typeof parsed.data.flags === "string" ? parsed.data.flags.split(",").map((item) => item.trim()).filter(Boolean) : undefined
      }
    });

    return NextResponse.json({ data: company });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Company not found." }, { status: 404 });
    }

    throw error;
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ customerId: string }> }) {
  const user = await requireUser(PERMISSIONS.COMPANIES_MANAGE);
  const { customerId } = await params;

  if (!user.roles.includes("admin")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const company = await prisma.company.findUnique({
    where: { id: customerId },
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
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
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

    await tx.portalAccessToken.deleteMany({ where: { companyId: customerId } });
    await tx.emailLog.deleteMany({ where: { companyId: customerId } });
    await tx.reminderJob.deleteMany({ where: { companyId: customerId } });
    await tx.communicationLog.deleteMany({ where: { companyId: customerId } });
    await tx.document.deleteMany({ where: { companyId: customerId } });
    await tx.note.deleteMany({ where: { companyId: customerId } });
    await tx.task.deleteMany({ where: { companyId: customerId } });
    await tx.address.deleteMany({ where: { companyId: customerId } });
    await tx.company.delete({ where: { id: customerId } });
  });

  return NextResponse.json({ ok: true });
}
