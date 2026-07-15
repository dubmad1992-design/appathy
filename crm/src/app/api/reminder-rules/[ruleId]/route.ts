import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { prisma } from "@/lib/db/prisma";
import { reminderRuleUpdateSchema } from "@/lib/validators/reminder";

export async function PATCH(request: Request, { params }: { params: Promise<{ ruleId: string }> }) {
  await requireUser(PERMISSIONS.SETTINGS_MANAGE);
  const { ruleId } = await params;
  const body = await request.json();
  const parsed = reminderRuleUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.templateKey) {
    const template = await prisma.emailTemplate.findUnique({ where: { key: parsed.data.templateKey } });
    if (!template) {
      return NextResponse.json({ error: "Email template not found." }, { status: 404 });
    }
  }

  try {
    const rule = await prisma.reminderRule.update({
      where: { id: ruleId },
      data: parsed.data
    });

    return NextResponse.json({ data: rule });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Reminder rule not found." }, { status: 404 });
    }

    throw error;
  }
}
