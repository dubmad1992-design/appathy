import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { canManageContent } from "@/lib/permissions";

export async function POST(request: Request) {
  const user = await requireAuth();

  if (!canManageContent(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File exceeds the 5MB upload limit." }, { status: 400 });
  }

  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-").toLowerCase()}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const outputPath = path.join(uploadDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(outputPath, buffer);

  const asset = await prisma.mediaAsset.create({
    data: {
      fileName,
      altText: String(formData.get("altText") ?? "") || null,
      url: `/uploads/${fileName}`,
      mimeType: file.type || "application/octet-stream",
      size: file.size
    }
  });

  return NextResponse.json({ success: true, data: asset });
}
