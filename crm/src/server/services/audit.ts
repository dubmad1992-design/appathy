import { prisma } from "@/lib/db/prisma";

export async function logAudit(action: string, entityType: string, entityId: string, summary: string, actorUserId?: string | null, metadata?: unknown) {
  await prisma.auditLog.create({
    data: {
      actorUserId: actorUserId ?? null,
      action,
      entityType,
      entityId,
      summary,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined
    }
  });
}
