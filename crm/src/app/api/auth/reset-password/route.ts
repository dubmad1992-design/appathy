import { NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/auth/session";
import { resetPasswordSchema } from "@/lib/validators/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid password reset payload." }, { status: 400 });
  }

  const user = await resetPasswordWithToken(parsed.data.token, parsed.data.password);
  if (!user) {
    return NextResponse.json({ error: "Token invalid or expired." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, email: user.email });
}
