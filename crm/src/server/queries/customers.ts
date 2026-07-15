import { prisma } from "@/lib/db/prisma";
import { serialize } from "@/lib/utils";

export async function getCompaniesList(search?: string) {
  const companies = await prisma.company.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { billingEmail: { contains: search, mode: "insensitive" } },
            { tags: { has: search } }
          ]
        }
      : undefined,
    include: {
      contacts: true,
      quotes: {
        take: 5,
        orderBy: { issueDate: "desc" }
      },
      invoices: {
        take: 5,
        orderBy: { dueDate: "desc" }
      },
      subscriptions: true,
      tasks: {
        where: { status: { in: ["OPEN", "IN_PROGRESS"] } }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  return serialize(companies);
}

export async function getCompanyDetail(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      contacts: {
        include: {
          addresses: true
        },
        orderBy: [{ isPrimary: "desc" }, { firstName: "asc" }, { lastName: "asc" }]
      },
      addresses: true,
      quotes: {
        include: {
          items: true,
          convertedInvoice: true
        },
        orderBy: { issueDate: "desc" }
      },
      invoices: {
        include: {
          payments: true,
          items: {
            orderBy: { sortOrder: "asc" }
          }
        },
        orderBy: { issueDate: "desc" }
      },
      subscriptions: {
        include: {
          events: {
            orderBy: { occurredAt: "desc" },
            take: 10
          }
        }
      },
      notes: {
        include: {
          author: true,
          contact: true,
          invoice: {
            select: {
              id: true,
              number: true
            }
          },
          subscription: {
            select: {
              id: true,
              serviceName: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      },
      documents: true,
      communicationLogs: {
        orderBy: { createdAt: "desc" },
        take: 20
      },
      tasks: {
        include: { assignedTo: true },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }]
      }
    }
  });

  return company ? serialize(company) : null;
}
