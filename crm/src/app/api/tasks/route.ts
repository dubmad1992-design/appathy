import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { prisma } from "@/lib/db/prisma";
import { taskSchema } from "@/lib/validators/task";

export async function GET() {
  await requireUser(PERMISSIONS.TASKS_VIEW);
  const tasks = await prisma.task.findMany({
    include: {
      company: true,
      assignedTo: true
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }]
  });

  return NextResponse.json({ data: tasks });
}

export async function POST(request: Request) {
  const user = await requireUser(PERMISSIONS.TASKS_MANAGE);
  const body = await request.json();
  const parsed = taskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      priority: parsed.data.priority,
      status: parsed.data.status,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
      assignedToUserId: parsed.data.assignedToUserId || null,
      companyId: parsed.data.companyId || null,
      contactId: parsed.data.contactId || null,
      invoiceId: parsed.data.invoiceId || null,
      subscriptionId: parsed.data.subscriptionId || null,
      createdByUserId: user.id
    }
  });

  return NextResponse.json({ data: task }, { status: 201 });
}
