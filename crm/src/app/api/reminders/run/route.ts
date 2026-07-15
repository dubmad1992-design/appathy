import { NextResponse } from "next/server";
import { runReminderSweep } from "@/server/services/reminders";

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");

  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const processed = await runReminderSweep();
  return NextResponse.json({ ok: true, processed });
}
