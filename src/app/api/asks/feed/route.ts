import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "İcazəsiz giriş" }, { status: 401 })
  }

  const userId = session.user.id
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") ?? "1", 10)
  const limit = 20
  const skip = (page - 1) * limit

  // Get active connections
  const connections = await prisma.connection.findMany({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
      status: "ACTIVE",
    },
  })

  const connectionUserIds = connections.map((c) =>
    c.userAId === userId ? c.userBId : c.userAId
  )

  // Get blocked users (both directions)
  const blocks = await prisma.blockRelation.findMany({
    where: {
      OR: [{ blockerId: userId }, { blockedId: userId }],
      status: "ACTIVE",
    },
  })
  const blockedUserIds = blocks.map((b) =>
    b.blockerId === userId ? b.blockedId : b.blockerId
  )

  const now = new Date()

  const asks = await prisma.ask.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { gt: now },
      OR: [
        {
          visibilityMode: "ALL_CONNECTIONS",
          authorId: { in: connectionUserIds },
        },
        {
          visibilityMode: "SELECTED_CONNECTIONS",
          audience: { some: { targetUserId: userId } },
        },
        { authorId: userId },
      ],
      author: {
        id: { notIn: blockedUserIds },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
    include: {
      author: { include: { profile: true } },
      category: true,
      city: true,
      _count: { select: { replies: { where: { status: "ACTIVE" } } } },
    },
  })

  return NextResponse.json({
    asks,
    page,
    hasMore: asks.length === limit,
  })
}
