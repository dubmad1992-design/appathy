import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { prisma } from "@/lib/prisma";

const execFileAsync = promisify(execFile);

type Pm2Process = {
  name?: string;
  pid?: number;
  monit?: {
    memory?: number;
  };
  pm2_env?: {
    status?: string;
    restart_time?: number;
    pm_uptime?: number;
  };
};

function formatUptime(startedAt?: number) {
  if (!startedAt) {
    return "Unknown";
  }

  const diffMs = Date.now() - startedAt;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours <= 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

async function readPm2Processes() {
  const { stdout } = await execFileAsync("pm2", ["jlist"]);
  return JSON.parse(stdout) as Pm2Process[];
}

export async function getManagedAppsOverview() {
  const [apps, processes] = await Promise.all([
    prisma.app.findMany({
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }]
    }),
    readPm2Processes().catch(() => [])
  ]);

  return apps.map((app) => {
    const process = processes.find((item) => item.name === app.processName);

    return {
      ...app,
      runtimeStatus: process?.pm2_env?.status ?? "unknown",
      pid: process?.pid ?? null,
      restartCount: process?.pm2_env?.restart_time ?? 0,
      uptime: formatUptime(process?.pm2_env?.pm_uptime),
      memoryMb: process?.monit?.memory ? Number((process.monit.memory / (1024 * 1024)).toFixed(1)) : null
    };
  });
}

export async function inspectManagedAppLogs(appKey: string) {
  const app = await prisma.app.findUnique({ where: { slug: appKey } });

  if (!app?.processName) {
    throw new Error("Managed app process not configured.");
  }

  const { stdout, stderr } = await execFileAsync("pm2", ["logs", app.processName, "--lines", "40", "--nostream"]);
  return { output: `${stdout}\n${stderr}`.trim() };
}

export async function inspectManagedAppHealth(appKey: string) {
  const app = await prisma.app.findUnique({ where: { slug: appKey } });

  if (!app?.healthUrl) {
    throw new Error("Managed app health URL not configured.");
  }

  const startedAt = Date.now();

  try {
    const response = await fetch(app.healthUrl, {
      method: "GET",
      redirect: "follow",
      cache: "no-store"
    });

    return {
      ok: response.ok,
      url: app.healthUrl,
      statusCode: response.status,
      responseTimeMs: Date.now() - startedAt
    };
  } catch {
    return {
      ok: false,
      url: app.healthUrl,
      statusCode: null,
      responseTimeMs: Date.now() - startedAt
    };
  }
}

export async function restartManagedApp(appKey: string) {
  const app = await prisma.app.findUnique({ where: { slug: appKey } });

  if (!app?.processName) {
    throw new Error("Managed app process not configured.");
  }

  await execFileAsync("pm2", ["restart", app.processName]);
  return app;
}
