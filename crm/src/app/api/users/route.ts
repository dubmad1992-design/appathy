import { NextResponse } from "next/server";
import { requireUser, hashPassword } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { prisma } from "@/lib/db/prisma";
import { userCreateSchema } from "@/lib/validators/user";

export async function GET() {
  await requireUser(PERMISSIONS.USERS_VIEW);
  const users = await prisma.user.findMany({
    include: {
      userRoles: {
        include: { role: true }
      }
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }]
  });

  return NextResponse.json({ data: users });
}

export async function POST(request: Request) {
  await requireUser(PERMISSIONS.USERS_MANAGE);
  const body = await request.json();
  const parsed = userCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "A user with that email already exists." }, { status: 409 });
  }

  const role = await prisma.role.findUnique({ where: { id: parsed.data.roleId } });
  if (!role) {
    return NextResponse.json({ error: "Role not found." }, { status: 404 });
  }

  const user = await prisma.user.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email,
      passwordHash: await hashPassword(parsed.data.password),
      jobTitle: parsed.data.jobTitle || null,
      status: parsed.data.status,
      userRoles: {
        create: [{ roleId: parsed.data.roleId }]
      }
    },
    include: {
      userRoles: {
        include: { role: true }
      }
    }
  });

  return NextResponse.json({ data: user }, { status: 201 });
}
