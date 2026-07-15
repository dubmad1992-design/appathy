import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  const user = await requireUser(PERMISSIONS.CUSTOMERS_MANAGE);
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }

  if (!file.size) {
    return NextResponse.json({ error: "The uploaded file is empty." }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Files must be 10 MB or smaller." }, { status: 400 });
  }

  const scope = String(formData.get("scope") ?? "GENERAL") as "COMPANY" | "CONTACT" | "INVOICE" | "SUBSCRIPTION" | "GENERAL";
  const companyId = (formData.get("companyId") as string | null) || null;
  const contactId = (formData.get("contactId") as string | null) || null;
  const invoiceId = (formData.get("invoiceId") as string | null) || null;
  const subscriptionId = (formData.get("subscriptionId") as string | null) || null;

  if (scope === "COMPANY" && !companyId) {
    return NextResponse.json({ error: "A company document must be linked to a company." }, { status: 400 });
  }

  const uploadDir = process.env.UPLOAD_DIR ?? "./public/uploads";
  const targetDir = path.resolve(process.cwd(), uploadDir, "documents");
  await mkdir(targetDir, { recursive: true });

  const safeBaseName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").toLowerCase();
  const fileName = `${Date.now()}-${safeBaseName}`;
  const absolutePath = path.join(targetDir, fileName);
  const relativePath = path.posix.join("/uploads", "documents", fileName);

  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

  const document = await prisma.document.create({
    data: {
      uploadedByUserId: user.id,
      scope,
      fileName: file.name,
      storagePath: relativePath,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      companyId,
      contactId,
      invoiceId,
      subscriptionId
    }
  });

  return NextResponse.json({ data: document }, { status: 201 });
}
