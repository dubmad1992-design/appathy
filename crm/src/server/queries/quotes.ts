import { prisma } from "@/lib/db/prisma";
import { serialize } from "@/lib/utils";

export async function getQuotesList() {
  const quotes = await prisma.quote.findMany({
    include: {
      company: true,
      contact: true,
      items: {
        orderBy: { sortOrder: "asc" }
      },
      convertedInvoice: true
    },
    orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }]
  });

  return serialize(quotes);
}
