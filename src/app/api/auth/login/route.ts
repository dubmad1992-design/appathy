import { NextRequest, NextResponse } from "next/server";
import { createSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { getRequestOrigin } from "@/lib/request-origin";

async function readRequestBody(request: NextRequest) {
  const type = request.headers.get("content-type") ?? "";

  if (type.includes("application/json")) {
    return request.json();
  }

  if (type.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    return {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      remember: String(formData.get("remember") ?? "true") !== "false"
    };
  }

  return {};
}

export async function POST(request: NextRequest) {
  try {
    const body = await readRequestBody(request);
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email }
    });

    if (!user || user.status === "disabled") {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);

    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      remember: parsed.data.remember
    });

    const wantsJson = (request.headers.get("content-type") ?? "").includes("application/json");

    if (wantsJson) {
      return NextResponse.json({
        success: true,
        data: { user: { id: user.id, name: user.name, email: user.email, role: user.role } }
      });
    }

    const origin = await getRequestOrigin();
    return NextResponse.redirect(new URL("/admin/dashboard", origin), { status: 303 });
  } catch (error) {
    console.error("login route failed", error);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
