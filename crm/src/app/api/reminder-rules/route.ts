import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { prisma } from "@/lib/db/prisma";
import { reminderRuleSchema } from "@/lib/validators/reminder";

export async function GET() {
  await requireUser(PERMISSIONS.SETTINGS_VIEW);
  const rules = await prisma.reminderRule.findMany({
    orderBy: [{ kind: "asc" }, { daysOffset: "desc" }]
  });

  return NextResponse.json({ data: rules });
}

export async function POST(request: Request) {
  await requireUser(PERMISSIONS.SETTINGS_MANAGE);
  const body = await request.json();
  const parsed = reminderRuleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const template = await prisma.emailTemplate.findUnique({ where: { key: parsed.data.templateKey } });
  if (!template) {
    return NextResponse.json({ error: "Email template not found." }, { status: 404 });
  }

  const duplicate = await prisma.reminderRule.findFirst({
    where: {
      kind: parsed.data.kind,
      daysOffset: parsed.data.daysOffset
    }
  });

  if (duplicate) {
    return NextResponse.json({ error: "A reminder rule with that timing already exists." }, { status: 409 });
  }

  const rule = await prisma.reminderRule.create({
    data: parsed.data
  });

  return NextResponse.json({ data: rule }, { status: 201 });
}
