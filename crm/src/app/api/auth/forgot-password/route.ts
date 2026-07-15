import { NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validators/auth";
import { issuePasswordResetToken } from "@/lib/auth/session";
import { sendEmail } from "@/server/services/email";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  const issued = await issuePasswordResetToken(parsed.data.email);
  if (issued) {
    const resetUrl = `${process.env.APP_URL ?? "http://127.0.0.1:3000"}/reset-password?token=${issued.token}`;
    await sendEmail({
      to: issued.user.email,
      subject: "Reset your Appathy CRM password",
      html: `<p>Hello ${issued.user.firstName},</p><p>Use the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      text: `Reset link: ${resetUrl}`,
      templateKey: "password_reset"
    });
  }

  return NextResponse.json({ ok: true });
}
