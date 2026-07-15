import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { createAssistantActionToken } from "@/lib/assistant-actions";
import { requireAuth } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/permissions";
import { getManagedAppsOverview, inspectManagedAppHealth, inspectManagedAppLogs } from "@/lib/vps-control";

function detectAppName(message: string, selectedAppName?: string | null) {
  const value = message.toLowerCase();
  if (value.includes("scfcooling")) return "SCFCooling";
  if (value.includes("macauley")) return "Macauleyraw";
  if (value.includes("appathy")) return "Appathy";
  return selectedAppName ?? null;
}

function detectIntent(message: string) {
  const value = message.toLowerCase();
  if (value.includes("restart")) return "restart";
  if (value.includes("log") || value.includes("debug") || value.includes("error")) return "logs";
  if (value.includes("health") || value.includes("status") || value.includes("check")) return "health";
  if (value.includes("edit") || value.includes("update") || value.includes("change")) return "edit";
  return "general";
}

function summarizeLogOutput(appName: string, output: string) {
  const lines = output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-80);
  const recent = lines.slice(-5);
  const lower = recent.join(" ").toLowerCase();

  if (!recent.length) {
    return `I checked the recent PM2 logs for ${appName}, but PM2 did not return enough recent lines to judge the app confidently. Suggested next action: run a health check before doing anything else.`;
  }

  if (lower.includes("error") || lower.includes("failed") || lower.includes("exception")) {
    return `I checked the recent PM2 logs for ${appName}. There are recent error signals in the process output. Suggested next action: inspect the failing lines more closely and avoid restarting until the root cause is clearer. Most relevant recent lines: ${recent.join(" | ")}`;
  }

  return `I checked the recent PM2 logs for ${appName}. The recent log output looks like normal startup/runtime activity rather than a clear failure. Suggested next action: run a health check. If it is passing, no restart is needed. Most relevant recent lines: ${recent.join(" | ")}`;
}

export async function POST(request: Request) {
  const user = await requireAuth();

  if (!hasRoleAccess(user.role, Role.ADMIN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = (await request.json()) as {
    message?: string;
    selectedAppName?: string;
    selectedAppKey?: string;
  };
  const message = body.message?.trim();

  if (!message) {
    return NextResponse.json({ message: "Ask about one of the VPS apps and I will map the safest next step." });
  }

  const apps = await getManagedAppsOverview();
  const appName = detectAppName(message, body.selectedAppName);
  const target = apps.find((item) => item.slug === body.selectedAppKey) ?? (appName ? apps.find((item) => item.name === appName) : null) ?? null;
  const intent = detectIntent(message);

  if (intent === "logs" && target) {
    const { output } = await inspectManagedAppLogs(target.slug);
    return NextResponse.json({ message: summarizeLogOutput(target.name, output) });
  }

  if (intent === "health" && target) {
    const result = await inspectManagedAppHealth(target.slug);
    return NextResponse.json({
      message: result.ok
        ? `${target.name} is healthy right now. Health URL: ${result.url}. Response: ${result.statusCode} in ${result.responseTimeMs}ms.`
        : `${target.name} did not pass the health check. Health URL: ${result.url}. Response: ${result.statusCode ?? "no response"} in ${result.responseTimeMs}ms.`
    });
  }

  if (intent === "restart" && target?.processName) {
    return NextResponse.json({
      message: `I can restart ${target.name}, but only after you confirm it. This will restart the live process ${target.processName}.`,
      action: {
        type: "restart_app",
        label: `Confirm restart: ${target.name}`,
        token: createAssistantActionToken({
          type: "restart_app",
          appKey: target.slug
        })
      }
    });
  }

  if (intent === "edit" && target) {
    return NextResponse.json({
      message: `Before AI can edit ${target.name} safely, it needs four things: 1. A confirmed working path: ${target.deployPath ?? "not set"}. 2. A confirmed runtime and process: ${target.runtime ?? "not set"}${target.processName ? ` using ${target.processName}` : ""}. 3. A constrained approval flow so code changes are proposed first and only applied after confirmation. 4. A verification step after edits, such as rebuild, health check, and site check${target.liveUrl ? ` on ${target.liveUrl}` : ""}.`
    });
  }

  return NextResponse.json({
    message: target
      ? `For ${target.name}, the safest path is to inspect logs, run a health check, and only then confirm a restart or code change.`
      : "Select one of the managed apps and I will help with the safest next operational step."
  });
}
