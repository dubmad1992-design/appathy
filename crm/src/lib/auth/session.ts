import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { prisma } from "@/lib/db/prisma";
import type { SessionUser } from "@/types";
const SESSION_DURATION_DAYS = 14;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function getSessionRecord(token: string) {
  return prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
}

function buildSessionUser(data: Awaited<ReturnType<typeof getSessionRecord>>) {
  if (!data?.user) {
    return null;
  }

  const roles = data.user.userRoles.map((entry) => entry.role.key);
  const permissions = data.user.userRoles.flatMap((entry) => entry.role.permissions.map((item) => item.permission.key));

  return {
    id: data.user.id,
    email: data.user.email,
    firstName: data.user.firstName,
    lastName: data.user.lastName,
    status: data.user.status,
    roles,
    permissions: Array.from(new Set(permissions))
  } satisfies SessionUser;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function authenticateCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!user || user.status !== "ACTIVE") {
    return null;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  return user;
}

export async function createUserSession(userId: string, metadata?: { userAgent?: string | null; ipAddress?: string | null }) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      userAgent: metadata?.userAgent ?? null,
      ipAddress: metadata?.ipAddress ?? null,
      expiresAt
    }
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_DURATION_DAYS
  });
}

export async function clearUserSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: { tokenHash: hashToken(token) }
    });
  }

  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await getSessionRecord(token);

  if (!session || session.expiresAt < new Date() || session.user.status !== "ACTIVE") {
    return null;
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() }
  });

  return buildSessionUser(session);
}

export async function requireUser(permission?: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (permission && !user.permissions.includes(permission)) {
    redirect("/dashboard");
  }

  return user;
}

export function hasPermission(user: SessionUser | null | undefined, permission: string) {
  return Boolean(user?.permissions.includes(permission));
}

export async function issuePasswordResetToken(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  if (!user) {
    return null;
  }

  const token = randomBytes(32).toString("hex");
  const ttl = Number(process.env.PASSWORD_RESET_TTL_MINUTES ?? 60);
  const expiresAt = new Date(Date.now() + ttl * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt
    }
  });

  return { token, user };
}

export async function resetPasswordWithToken(token: string, password: string) {
  const tokenHash = hashToken(token);
  const reset = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true }
  });

  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    return null;
  }

  await prisma.passwordResetToken.update({
    where: { id: reset.id },
    data: { usedAt: new Date() }
  });

  await prisma.user.update({
    where: { id: reset.userId },
    data: { passwordHash: await hashPassword(password) }
  });

  await prisma.session.deleteMany({
    where: { userId: reset.userId }
  });

  return reset.user;
}
