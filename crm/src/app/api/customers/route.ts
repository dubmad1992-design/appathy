import { NextResponse } from "next/server";
import { hasPermission, requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { prisma } from "@/lib/db/prisma";
import { customerOnboardingSchema } from "@/lib/validators/customer";

function splitCommaSeparatedValue(value?: string) {
  return value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
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

export async function GET() {
  const user = await requireUser(PERMISSIONS.CUSTOMERS_VIEW);
  if (!hasPermission(user, PERMISSIONS.CUSTOMERS_VIEW)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const companies = await prisma.company.findMany({
    include: {
      contacts: true,
      quotes: true,
      subscriptions: true,
      invoices: true
    },
    orderBy: { updatedAt: "desc" }
  });

  return NextResponse.json({ data: companies });
}

export async function POST(request: Request) {
  const user = await requireUser(PERMISSIONS.COMPANIES_MANAGE);
  const body = await request.json();
  const parsed = customerOnboardingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
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

  return NextResponse.json({ data: company, actor: user.id }, { status: 201 });
}
