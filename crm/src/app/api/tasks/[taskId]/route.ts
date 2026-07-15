import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { prisma } from "@/lib/db/prisma";
import { taskSchema } from "@/lib/validators/task";

export async function PATCH(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  await requireUser(PERMISSIONS.TASKS_MANAGE);
  const { taskId } = await params;
  const body = await request.json();
  const parsed = taskSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...parsed.data,
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined
      }
    });

    return NextResponse.json({ data: task });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    throw error;
  }
}
