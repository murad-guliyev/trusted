import { getAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextRequest } from "next/server"

export async function requireAuth(_req?: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED")
  }
  return session
}

export async function isConnected(
  userIdA: string,
  userIdB: string
): Promise<boolean> {
  const connection = await prisma.connection.findFirst({
    where: {
      OR: [
        { userAId: userIdA, userBId: userIdB },
        { userAId: userIdB, userBId: userIdA },
      ],
      status: "ACTIVE",
    },
  })
  return connection !== null
}

export async function canViewAsk(
  userId: string,
  askId: string
): Promise<boolean> {
  const ask = await prisma.ask.findUnique({
    where: { id: askId },
    include: { audience: true },
  })

  if (!ask) return false
  if (ask.status === "REMOVED") return false
  if (ask.expiresAt < new Date()) return false

  // Ask author can always view their own ask
  if (ask.authorId === userId) return true

  if (ask.visibilityMode === "ALL_CONNECTIONS") {
    return isConnected(userId, ask.authorId)
  }

  if (ask.visibilityMode === "SELECTED_CONNECTIONS") {
    return ask.audience.some((a) => a.targetUserId === userId)
  }

  return false
}

export async function isBlocked(
  viewerId: string,
  targetId: string
): Promise<boolean> {
  const block = await prisma.blockRelation.findFirst({
    where: {
      OR: [
        { blockerId: viewerId, blockedId: targetId },
        { blockerId: targetId, blockedId: viewerId },
      ],
      status: "ACTIVE",
    },
  })
  return block !== null
}
