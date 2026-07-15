import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { prisma } from "@/lib/db/prisma";
import { billingSettingsSchema, businessSettingsSchema } from "@/lib/validators/settings";

export async function GET() {
  await requireUser(PERMISSIONS.SETTINGS_VIEW);
  const settings = await prisma.setting.findMany({
    orderBy: [{ category: "asc" }, { key: "asc" }]
  });

  return NextResponse.json({ data: settings });
}

export async function PATCH(request: Request) {
  await requireUser(PERMISSIONS.SETTINGS_MANAGE);
  const body = await request.json();

  const business = businessSettingsSchema.safeParse(body.business ?? {});
  const billing = billingSettingsSchema.safeParse(body.billing ?? {});

  if (!business.success || !billing.success) {
    return NextResponse.json({ error: "Invalid settings payload." }, { status: 400 });
  }

  await prisma.setting.upsert({
    where: { category_key: { category: "business", key: "profile" } },
    update: { value: business.data },
    create: { category: "business", key: "profile", value: business.data }
  });

  await prisma.setting.upsert({
    where: { category_key: { category: "billing", key: "defaults" } },
    update: { value: billing.data },
    create: { category: "billing", key: "defaults", value: billing.data }
  });

  return NextResponse.json({ ok: true });
}
