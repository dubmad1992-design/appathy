import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { authenticateCredentials, createUserSession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validators/auth";
import { logAudit } from "@/server/services/audit";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials payload." }, { status: 400 });
  }

  const user = await authenticateCredentials(parsed.data.email, parsed.data.password);
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const requestHeaders = await headers();
  await createUserSession(user.id, {
    userAgent: requestHeaders.get("user-agent"),
    ipAddress: requestHeaders.get("x-forwarded-for")
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  await logAudit("user.login", "user", user.id, `${user.email} signed in via API`, user.id);

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email
    }
  });
}
