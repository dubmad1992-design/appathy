"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { authenticateCredentials, clearUserSession, createUserSession, issuePasswordResetToken, resetPasswordWithToken } from "@/lib/auth/session";
import { forgotPasswordSchema, loginSchema, resetPasswordSchema } from "@/lib/validators/auth";
import { logAudit } from "@/server/services/audit";
import { sendEmail } from "@/server/services/email";

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    redirect("/login?error=invalid_credentials");
  }

  const user = await authenticateCredentials(parsed.data.email, parsed.data.password);
  if (!user) {
    redirect("/login?error=invalid_credentials");
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

  await logAudit("user.login", "user", user.id, `${user.email} signed in`, user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearUserSession();
  redirect("/login");
}

export async function forgotPasswordAction(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email")
  });

  if (!parsed.success) {
    redirect("/forgot-password?error=invalid_email");
  }

  const issued = await issuePasswordResetToken(parsed.data.email);

  if (issued) {
    const resetUrl = `${process.env.APP_URL ?? "http://127.0.0.1:3000"}/reset-password?token=${issued.token}`;
    await sendEmail({
      to: issued.user.email,
      subject: "Reset your Appathy CRM password",
      html: `<p>Hello ${issued.user.firstName},</p><p>Use the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      text: `Reset your password using this link: ${resetUrl}`,
      templateKey: "password_reset"
    });
  }

  redirect("/forgot-password?sent=1");
}

export async function resetPasswordAction(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword")
  });

  if (!parsed.success) {
    redirect(`/reset-password?token=${formData.get("token")}&error=validation`);
  }

  const user = await resetPasswordWithToken(parsed.data.token, parsed.data.password);
  if (!user) {
    redirect(`/reset-password?token=${parsed.data.token}&error=token`);
  }

  await logAudit("user.password_reset", "user", user.id, `${user.email} reset their password`, user.id);
  redirect("/login?reset=1");
}
