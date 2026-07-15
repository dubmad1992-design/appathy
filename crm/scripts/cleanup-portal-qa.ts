import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteCompanyGraph(companyId: string) {
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
    return;
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

  console.log(`deleted ${company.name}`);
}

async function main() {
  const names = process.argv.slice(2);
  if (!names.length) {
    throw new Error("Pass one or more company names to delete.");
  }

  const companies = await prisma.company.findMany({
    where: { name: { in: names } },
    select: { id: true }
  });

  for (const company of companies) {
    await deleteCompanyGraph(company.id);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
