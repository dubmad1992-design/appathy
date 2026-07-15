import { prisma } from "@/lib/db/prisma";

export async function generateQuoteNumber() {
  const prefixSetting = await prisma.setting.findUnique({
    where: {
      category_key: {
        category: "billing",
        key: "defaults"
      }
    }
  });

  const invoicePrefix = (prefixSetting?.value as { invoicePrefix?: string } | null)?.invoicePrefix ?? process.env.INVOICE_PREFIX ?? "APP";
  const prefix = `QUO-${invoicePrefix}`;
  const year = new Date().getFullYear();
  const count = await prisma.quote.count({
    where: {
      number: {
        startsWith: `${prefix}-${year}-`
      }
    }
  });

  return `${prefix}-${year}-${String(count + 1).padStart(4, "0")}`;
}

