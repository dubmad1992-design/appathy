import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { prisma } from "@/lib/db/prisma";
import { userUpdateSchema } from "@/lib/validators/user";

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  await requireUser(PERMISSIONS.USERS_MANAGE);
  const { userId } = await params;
  const body = await request.json();
  const parsed = userUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.roleId) {
    const role = await prisma.role.findUnique({ where: { id: parsed.data.roleId } });
    if (!role) {
      return NextResponse.json({ error: "Role not found." }, { status: 404 });
    }
  }

  try {
    const user = await prisma.$transaction(async (tx) => {
      if (parsed.data.roleId) {
        await tx.userRole.deleteMany({ where: { userId } });
        await tx.userRole.create({
          data: {
            userId,
            roleId: parsed.data.roleId
          }
        });
      }

      return tx.user.update({
        where: { id: userId },
        data: {
          status: parsed.data.status,
          jobTitle: parsed.data.jobTitle
        },
        include: {
          userRoles: {
            include: { role: true }
          }
        }
      });
    });

    return NextResponse.json({ data: user });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    throw error;
  }
}
