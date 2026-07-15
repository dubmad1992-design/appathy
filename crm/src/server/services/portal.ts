import { createHash, randomBytes } from "node:crypto";
import { PortalAccessType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "https://crm.appathy.uk";
}

export async function issuePortalAccessToken(input: {
  type: PortalAccessType;
  companyId?: string | null;
  contactId?: string | null;
  invoiceId?: string | null;
  quoteId?: string | null;
  expiresAt?: Date;
}) {
  const token = randomBytes(24).toString("hex");
  const expiresAt = input.expiresAt ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);

  await prisma.portalAccessToken.create({
    data: {
      tokenHash: hashToken(token),
      type: input.type,
      companyId: input.companyId ?? null,
      contactId: input.contactId ?? null,
      invoiceId: input.invoiceId ?? null,
      quoteId: input.quoteId ?? null,
      expiresAt
    }
  });

  return {
    token,
    url: `${getBaseUrl()}/portal/${token}`,
    expiresAt
  };
}

export async function resolvePortalAccessToken(token: string) {
  const record = await prisma.portalAccessToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      company: true,
      contact: true,
      invoice: {
        include: {
          company: true,
          contact: true,
          items: { orderBy: { sortOrder: "asc" } }
        }
      },
      quote: {
        include: {
          company: true,
          contact: true,
          items: { orderBy: { sortOrder: "asc" } },
          convertedInvoice: true
        }
      }
    }
  });

  if (!record || record.expiresAt < new Date()) {
    return null;
  }

  await prisma.portalAccessToken.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() }
  });

  return record;
}

