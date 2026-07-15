import { execFile } from "node:child_process";
import { createReadStream } from "node:fs";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRequestOrigin } from "@/lib/request-origin";

const execFileAsync = promisify(execFile);

export async function GET() {
  const user = await getCurrentUser();

  if (!user || (user.role !== Role.SUPER_ADMIN && user.role !== Role.ADMIN)) {
    return NextResponse.redirect(new URL("/admin/login", await getRequestOrigin()));
  }

  const stamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, "-");
  const fileName = `appathy-backup-${stamp}.tar.gz`;
  const workDir = await mkdtemp(path.join(tmpdir(), "appathy-backup-"));
  const dbSnapshot = path.join(workDir, "database.db");
  const archive = path.join(workDir, fileName);

  try {
    // VACUUM INTO produces a consistent snapshot even mid-write, unlike copying the file.
    await prisma.$executeRawUnsafe(`VACUUM INTO '${dbSnapshot}'`);
    await execFileAsync("tar", [
      "czf",
      archive,
      "-C",
      workDir,
      "database.db",
      "-C",
      process.cwd(),
      "public/uploads"
    ]);

    const { size } = await stat(archive);
    const stream = createReadStream(archive);
    stream.on("close", () => {
      void rm(workDir, { recursive: true, force: true });
    });

    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Length": String(size),
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    await rm(workDir, { recursive: true, force: true });
    console.error("Backup failed:", error);
    return NextResponse.json({ error: "Backup failed." }, { status: 500 });
  }
}
