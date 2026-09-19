import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function logAdminAction(
  actor: { id: string; email: string },
  action: string,
  opts?: {
    targetStoreId?: string;
    targetUserId?: string;
    metadata?: Prisma.InputJsonValue;
  }
) {
  await prisma.adminAuditLog.create({
    data: {
      actorUserId: actor.id,
      actorEmail: actor.email,
      action,
      targetStoreId: opts?.targetStoreId,
      targetUserId: opts?.targetUserId,
      metadata: opts?.metadata,
    },
  });
}
