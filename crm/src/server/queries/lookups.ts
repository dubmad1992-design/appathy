import { prisma } from "@/lib/db/prisma";
import { serialize } from "@/lib/utils";

export async function getCrmLookups() {
  const [companies, contacts, users, settings, templates] = await Promise.all([
    prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    }),
    prisma.contact.findMany({
      select: { id: true, firstName: true, lastName: true, email: true, companyId: true, isPrimary: true },
      orderBy: [{ companyId: "asc" }, { isPrimary: "desc" }, { firstName: "asc" }, { lastName: "asc" }]
    }),
    prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }]
    }),
    prisma.setting.findMany(),
    prisma.emailTemplate.findMany({
      orderBy: { key: "asc" }
    })
  ]);

  return serialize({
    companies,
    contacts,
    users,
    settings,
    templates
  });
}
