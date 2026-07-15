import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { verifyAssistantActionToken } from "@/lib/assistant-actions";
import { hasRoleAccess } from "@/lib/permissions";
import { restartManagedApp } from "@/lib/vps-control";

export async function POST(request: Request) {
  const user = await requireAuth();

  if (!hasRoleAccess(user.role, Role.ADMIN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = (await request.json()) as { token?: string };

  if (!body.token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const payload = verifyAssistantActionToken(body.token);

  if (payload.type === "restart_app") {
    const app = await restartManagedApp(payload.appKey);
    return NextResponse.json({ success: true, message: `${app.name} has been restarted.` });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
